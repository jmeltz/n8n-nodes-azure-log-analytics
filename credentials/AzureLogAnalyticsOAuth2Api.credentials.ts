import type {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class AzureLogAnalyticsOAuth2Api implements ICredentialType {
	name = 'azureLogAnalyticsOAuth2Api';

	displayName = 'Azure Log Analytics OAuth2 API';

	documentationUrl = 'https://learn.microsoft.com/en-us/azure/azure-monitor/logs/api/access-api';

	icon = {
		light: 'file:../nodes/AzureLogAnalytics/azure-monitor-logs-icon.png',
		dark: 'file:../nodes/AzureLogAnalytics/azure-monitor-logs-icon.png',
	} as const;

	properties: INodeProperties[] = [
		{
			displayName: 'Tenant ID',
			name: 'tenantId',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
			description: 'The Azure Active Directory Tenant ID (Directory ID)',
		},
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
			description: 'The Application (client) ID from your Azure AD app registration',
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'The client secret from your Azure AD app registration',
		},
	];
}
