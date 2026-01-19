"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureLogAnalyticsOAuth2Api = void 0;
class AzureLogAnalyticsOAuth2Api {
    constructor() {
        this.name = 'azureLogAnalyticsOAuth2Api';
        this.displayName = 'Azure Log Analytics OAuth2 API';
        this.documentationUrl = 'https://learn.microsoft.com/en-us/azure/azure-monitor/logs/api/access-api';
        this.icon = {
            light: 'file:../nodes/AzureLogAnalytics/azure-monitor-logs-icon.png',
            dark: 'file:../nodes/AzureLogAnalytics/azure-monitor-logs-icon.png',
        };
        this.properties = [
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
}
exports.AzureLogAnalyticsOAuth2Api = AzureLogAnalyticsOAuth2Api;
//# sourceMappingURL=AzureLogAnalyticsOAuth2Api.credentials.js.map