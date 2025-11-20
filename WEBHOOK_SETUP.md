# Webhook Setup Instructions

## Webhook Configuration

Your booking form is configured to send all submissions to:

```
https://tagi.app.n8n.cloud/webhook/ad1dc79b-e77d-44e0-b233-2d78381beb4b
```

**Method**: POST
**Content-Type**: application/json

## What Gets Sent

Each form submission sends this JSON data:

```json
{
  "name": "Customer Name",
  "address": "123 Main Street",
  "phone": "(555) 123-4567",
  "email": "customer@example.com",
  "date": "2025-11-20",
  "lightOption": "clear-red|clear-warm|alternating",
  "tipColor": "red|white|N/A",
  "onWaitlist": false,
  "timestamp": "2025-11-20T14:30:00.000Z",
  "depositAmount": "$200"
}
```

## n8n Webhook Activation

To receive form submissions, you need to:

1. Open your n8n workflow
2. Add or configure your webhook node with this URL: `ad1dc79b-e77d-44e0-b233-2d78381beb4b`
3. Make sure it's set to accept **POST** requests
4. Click "Execute workflow" or activate the workflow
5. The webhook will then accept POST requests from your form

## Testing the Webhook

Once activated in n8n, you can test by running:

```bash
curl -X POST https://tagi.app.n8n.cloud/webhook/ad1dc79b-e77d-44e0-b233-2d78381beb4b \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "address": "123 Test St",
    "phone": "555-1234",
    "email": "john@example.com",
    "date": "2025-11-20",
    "lightOption": "clear-red",
    "tipColor": "N/A",
    "onWaitlist": false,
    "timestamp": "2025-11-20T10:00:00.000Z",
    "depositAmount": "$200"
  }'
```

## What to Do With the Data

In n8n, you can:

- Send an email to nicklynch@bonusthoughts.com with booking details
- Save to a Google Sheet or database
- Create calendar events
- Send SMS notifications
- Generate booking confirmations
- Track availability and manage waitlists

## Troubleshooting

**"This webhook is not registered for POST requests"**
- Make sure to activate/execute the workflow in n8n first
- Check that the webhook node is properly configured for POST

**Form submission fails**
- Check browser console for error messages
- Verify the webhook URL is correct
- Ensure n8n webhook is activated
- Check n8n logs for any errors

**No data received**
- Confirm the form is submitting successfully (green success message)
- Verify n8n webhook is still active
- Check n8n execution history
