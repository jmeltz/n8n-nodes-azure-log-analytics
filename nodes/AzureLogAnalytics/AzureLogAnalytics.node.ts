import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestMethods,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

interface AzureTokenResponse {
	access_token: string;
	token_type: string;
	expires_in: string;
}

interface LogAnalyticsColumn {
	name: string;
	type: string;
}

interface LogAnalyticsTable {
	name: string;
	columns: LogAnalyticsColumn[];
	rows: unknown[][];
}

interface LogAnalyticsResponse {
	tables: LogAnalyticsTable[];
}

export class AzureLogAnalytics implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Azure Log Analytics',
		name: 'azureLogAnalytics',
		icon: 'file:azure-monitor-logs-icon.png',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Query Azure Monitor Log Analytics workspaces using KQL',
		defaults: {
			name: 'Azure Log Analytics',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'azureLogAnalyticsOAuth2Api',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Execute Query',
						value: 'executeQuery',
						description: 'Execute a KQL query against a Log Analytics workspace',
						action: 'Execute a KQL query',
					},
				],
				default: 'executeQuery',
			},
			{
				displayName: 'Workspace ID',
				name: 'workspaceId',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
				description: 'The Log Analytics Workspace ID (found in workspace properties)',
				displayOptions: {
					show: {
						operation: ['executeQuery'],
					},
				},
			},
			{
				displayName: 'Query (KQL)',
				name: 'query',
				type: 'string',
				typeOptions: {
					rows: 5,
				},
				default: '',
				required: true,
				placeholder: 'AzureActivity | summarize count() by Category',
				description: 'The Kusto Query Language (KQL) query to execute',
				displayOptions: {
					show: {
						operation: ['executeQuery'],
					},
				},
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						operation: ['executeQuery'],
					},
				},
				options: [
					{
						displayName: 'Timespan',
						name: 'timespan',
						type: 'string',
						default: '',
						placeholder: 'P1D, PT1H, 2024-01-01/2024-01-02',
						description: 'ISO 8601 duration or time interval (e.g., P1D for 1 day, PT1H for 1 hour, or start/end timestamps)',
					},
					{
						displayName: 'Output Format',
						name: 'outputFormat',
						type: 'options',
						options: [
							{
								name: 'Rows as Objects',
								value: 'objects',
								description: 'Each row as a JSON object with column names as keys',
							},
							{
								name: 'Raw Response',
								value: 'raw',
								description: 'Return the raw API response with tables, columns, and rows',
							},
						],
						default: 'objects',
						description: 'How to format the query results',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('azureLogAnalyticsOAuth2Api');

		const tenantId = credentials.tenantId as string;
		const clientId = credentials.clientId as string;
		const clientSecret = credentials.clientSecret as string;

		// Build form body for token request (using v2.0 endpoint with scope)
		const tokenBody = [
			'grant_type=client_credentials',
			`client_id=${encodeURIComponent(clientId)}`,
			`client_secret=${encodeURIComponent(clientSecret)}`,
			'scope=https://api.loganalytics.io/.default',
		].join('&');

		// Get OAuth2 access token
		let accessToken: string;
		try {
			const tokenResponse = await this.helpers.httpRequest({
				method: 'POST' as IHttpRequestMethods,
				url: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: tokenBody,
			}) as AzureTokenResponse;

			accessToken = tokenResponse.access_token;
		} catch (error) {
			throw new NodeOperationError(
				this.getNode(),
				'Failed to authenticate with Azure. Please check your credentials.',
				{ description: error instanceof Error ? error.message : String(error) },
			);
		}

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

				if (operation === 'executeQuery') {
					const workspaceId = this.getNodeParameter('workspaceId', i) as string;
					const query = this.getNodeParameter('query', i) as string;
					const options = this.getNodeParameter('options', i) as {
						timespan?: string;
						outputFormat?: string;
					};

					const body: { query: string; timespan?: string } = { query };

					if (options.timespan) {
						body.timespan = options.timespan;
					}

					const response = await this.helpers.httpRequest({
						method: 'POST' as IHttpRequestMethods,
						url: `https://api.loganalytics.io/v1/workspaces/${workspaceId}/query`,
						headers: {
							Authorization: `Bearer ${accessToken}`,
							'Content-Type': 'application/json',
						},
						body,
						json: true,
					}) as LogAnalyticsResponse;

					const outputFormat = options.outputFormat || 'objects';

					if (outputFormat === 'raw') {
						returnData.push({
							json: response as unknown as IDataObject,
							pairedItem: { item: i },
						});
					} else {
						// Convert rows to objects with column names
						if (response.tables && response.tables.length > 0) {
							const table = response.tables[0];
							const columns = table.columns.map((col) => col.name);

							for (const row of table.rows) {
								const obj: IDataObject = {};
								columns.forEach((col, index) => {
									obj[col] = row[index] as IDataObject[keyof IDataObject];
								});
								returnData.push({
									json: obj,
									pairedItem: { item: i },
								});
							}
						}
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error instanceof Error ? error.message : String(error),
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
