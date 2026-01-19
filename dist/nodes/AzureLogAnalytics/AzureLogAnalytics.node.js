"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureLogAnalytics = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class AzureLogAnalytics {
    constructor() {
        this.description = {
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
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        const credentials = await this.getCredentials('azureLogAnalyticsOAuth2Api');
        const tenantId = credentials.tenantId;
        const clientId = credentials.clientId;
        const clientSecret = credentials.clientSecret;
        // Build form body for token request
        const tokenBody = [
            'grant_type=client_credentials',
            `client_id=${encodeURIComponent(clientId)}`,
            `client_secret=${encodeURIComponent(clientSecret)}`,
            'resource=https://api.loganalytics.azure.com',
        ].join('&');
        // Get OAuth2 access token
        let accessToken;
        try {
            const tokenResponse = await this.helpers.httpRequest({
                method: 'POST',
                url: `https://login.microsoftonline.com/${tenantId}/oauth2/token`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: tokenBody,
            });
            accessToken = tokenResponse.access_token;
        }
        catch (error) {
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Failed to authenticate with Azure. Please check your credentials.', { description: error instanceof Error ? error.message : String(error) });
        }
        for (let i = 0; i < items.length; i++) {
            try {
                const operation = this.getNodeParameter('operation', i);
                if (operation === 'executeQuery') {
                    const workspaceId = this.getNodeParameter('workspaceId', i);
                    const query = this.getNodeParameter('query', i);
                    const options = this.getNodeParameter('options', i);
                    const body = { query };
                    if (options.timespan) {
                        body.timespan = options.timespan;
                    }
                    const response = await this.helpers.httpRequest({
                        method: 'POST',
                        url: `https://api.loganalytics.azure.com/v1/workspaces/${workspaceId}/query`,
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body,
                        json: true,
                    });
                    const outputFormat = options.outputFormat || 'objects';
                    if (outputFormat === 'raw') {
                        returnData.push({
                            json: response,
                            pairedItem: { item: i },
                        });
                    }
                    else {
                        // Convert rows to objects with column names
                        if (response.tables && response.tables.length > 0) {
                            const table = response.tables[0];
                            const columns = table.columns.map((col) => col.name);
                            for (const row of table.rows) {
                                const obj = {};
                                columns.forEach((col, index) => {
                                    obj[col] = row[index];
                                });
                                returnData.push({
                                    json: obj,
                                    pairedItem: { item: i },
                                });
                            }
                        }
                    }
                }
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            error: error instanceof Error ? error.message : String(error),
                        },
                        pairedItem: { item: i },
                    });
                    continue;
                }
                throw new n8n_workflow_1.NodeApiError(this.getNode(), error, { itemIndex: i });
            }
        }
        return [returnData];
    }
}
exports.AzureLogAnalytics = AzureLogAnalytics;
//# sourceMappingURL=AzureLogAnalytics.node.js.map