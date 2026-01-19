# n8n-nodes-azure-log-analytics

This is an n8n community node that lets you query [Azure Monitor Log Analytics](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/log-analytics-overview) workspaces using KQL (Kusto Query Language).

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

- **Execute Query**: Run a KQL query against a Log Analytics workspace

## Credentials

To use this node, you need to create an Azure AD app registration with access to your Log Analytics workspace.

### Setup Steps

1. **Create an App Registration** in Azure Active Directory:
   - Go to Azure Portal > Azure Active Directory > App registrations > New registration
   - Note the **Application (client) ID** and **Directory (tenant) ID**

2. **Create a Client Secret**:
   - In your app registration, go to Certificates & secrets > New client secret
   - Copy the secret value immediately (it won't be shown again)

3. **Grant API Permissions**:
   - In your app registration, go to API permissions > Add a permission
   - Select "APIs my organization uses" and search for "Log Analytics API"
   - Add the `Data.Read` permission
   - Grant admin consent if required

4. **Assign Workspace Access**:
   - Go to your Log Analytics workspace > Access control (IAM)
   - Add a role assignment for your app registration
   - Assign the **Log Analytics Reader** role (or a custom role with query permissions)

### Credential Fields

| Field | Description |
|-------|-------------|
| Tenant ID | Your Azure AD Directory (tenant) ID |
| Client ID | The Application (client) ID from your app registration |
| Client Secret | The client secret you created |

## Usage

1. Add the **Azure Log Analytics** node to your workflow
2. Select your configured credentials
3. Enter your **Workspace ID** (found in the Log Analytics workspace overview in Azure Portal)
4. Write your **KQL query**
5. Optionally configure:
   - **Timespan**: ISO 8601 duration (e.g., `P1D` for 1 day, `PT1H` for 1 hour)
   - **Output Format**: Return rows as JSON objects or raw API response

### Example Query

```kql
AzureActivity
| where TimeGenerated > ago(1d)
| summarize count() by Category
| order by count_ desc
```

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Azure Monitor Log Analytics API documentation](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/api/overview)
- [KQL quick reference](https://learn.microsoft.com/en-us/azure/data-explorer/kql-quick-reference)

## License

[MIT](LICENSE)
