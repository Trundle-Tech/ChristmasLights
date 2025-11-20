# Christmas Lights Before Christmas - Booking Form

## Project Overview
A React-based booking form for "Christmas Lights Before Christmas" installations with:
- **Service**: $5.50 per foot
- **Included**: Takedown service, POV video of setup
- **Add-ons**: Plug in Timer, Storage Bins, Offsite Storage
- Date selection (Nov 20 - Dec 11, 2025)
- Light color options (Red, Warm White, Alternating)
- $200 deposit payment via Square
- n8n webhook integration for form submissions
- Google Sheets integration for managing availability
- Professional completion page with confirmation details

## Current Implementation

### Tech Stack
- **Frontend**: React 18 with TypeScript
- **Styling**: CSS (custom, responsive design)
- **API**: Google Sheets CSV export (no authentication needed)
- **Webhooks**: n8n for form submission handling
- **Deployment**: Ready for Netlify via GitHub

### Key Features
1. **Date Management**
   - Fetches booked dates from Google Sheet on page load
   - Uses CSV export from Google Sheets (public)
   - Marks dates as booked/available in real-time
   - Shows available slot count

2. **Form Fields**
   - Name, Address, Phone, Email (required)
   - Date selection (radio buttons, disabled if booked)
   - Light options (C9 Red, C9 Warm White, Alternating)
   - Tip color selection (for alternating pattern)
   - Terms & conditions checkbox

3. **Form Submission**
   - Validates all required fields
   - Sends POST request to n8n webhook
   - Includes metadata: `action` (book/waitlist), `timestamp`
   - Shows success message briefly (2 seconds)
   - Transitions to completion page with booking summary

4. **Completion Page**
   - Animated checkmark icon
   - Shows all booking details (name, email, phone, date, light options)
   - **Prominently displays Square payment link** for $200 deposit
   - Lists next steps for customer
   - "Make Another Booking" button to reset form
   - User flow: Book → See Summary → Pay Deposit

5. **Waitlist Functionality**
   - When all dates are booked, shows waitlist option
   - Changes button text to "Join Waitlist"
   - No deposit required for waitlist

## Google Sheets Integration

### Sheet Setup
**Spreadsheet ID**: `1BT-ArD3fpR89wx66SeT4wFuUHWUe3_XJoKQvdT4jZsY`

**Columns Required**:
- Column A: `date` (format: YYYY-MM-DD, e.g., 2025-11-20)
- Column B: `booked` (TRUE or FALSE)

**Data**:
- Rows 2-23 contain dates from Nov 20 - Dec 11, 2025
- All dates initially set to FALSE
- Shared as "Anyone with the link can view"

### How It Works
1. Form fetches Google Sheet as CSV on page load
2. Parses date and booked columns
3. Updates UI to show only available dates
4. When booking submitted, n8n workflow updates sheet
5. Next page load fetches fresh availability data

## n8n Webhook Configuration

**Webhook URL**: `https://tagi.app.n8n.cloud/webhook/ad1dc79b-e77d-44e0-b233-2d78381beb4b`

**Method**: POST

**Data Received**:
```json
{
  "name": "string",
  "address": "string",
  "phone": "string",
  "email": "string",
  "date": "11/20/2025",
  "lightOption": "clear-red|clear-warm|alternating",
  "tipColor": "red|white|N/A",
  "onWaitlist": boolean,
  "timestamp": "ISO string",
  "depositAmount": "$200",
  "action": "book|waitlist"
}
```
**Note**: Date is sent in MM/DD/YYYY format to webhook

**Workflow Actions Needed**:
1. Receive booking webhook
2. If `action === 'book'`:
   - Update Google Sheet: Find row with matching date
   - Set `booked` column to TRUE
3. Send confirmation email to customer
4. (Optional) Save full booking details to database/sheet

## File Structure

```
christmas-lights/
├── src/
│   ├── components/
│   │   └── BookingForm.tsx          # Main form component
│   ├── styles/
│   │   └── BookingForm.css          # Form styling
│   ├── App.tsx                      # App wrapper
│   ├── index.tsx                    # React entry point
│   └── react-app-env.d.ts
├── public/
│   ├── index.html                   # HTML with Stripe script
│   ├── favicon.ico
│   └── manifest.json
├── netlify.toml                     # Netlify config (git deployment)
├── netlify/
│   └── functions/                   # Empty - for future use
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── DEPLOYMENT.md                    # Deployment instructions
├── WEBHOOK_SETUP.md                 # Webhook configuration guide
└── claude.md                        # This file
```

## Recent Updates

### Latest Changes
- **Google Sheets Integration Added**: Form now fetches booked dates from public Google Sheet on page load
- **Completion Page**: Added animated confirmation page with booking details summary
- **Webhook Action Field**: Added `action` field to indicate book vs waitlist
- **Removed Stripe Frontend**: Payment processing removed from form (can be handled in n8n)

### Previous Updates
- Initial form creation with all booking fields
- Date selection with 1 installation per day limit
- Light options with conditional tip color selection
- n8n webhook integration
- Responsive CSS styling
- Terms & conditions checkbox

## Development Notes

### Performance
- Google Sheets fetch happens once on component mount
- CSV parsing is lightweight (minimal data)
- Form is fully client-side (no backend needed initially)

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive
- CSS Grid and Flexbox for layout

### Accessibility
- Proper form labels with htmlFor attributes
- Semantic HTML (fieldset, legend)
- Error messages displayed clearly
- Success states visible to users

## Known Limitations / Future Improvements

1. **Sheet Update Latency**: After booking, availability updates on next page load (not instant)
   - Solution: Could add polling or WebSocket for real-time updates

2. **CSV Parsing**: Simple split() method
   - Could add proper CSV library if sheet structure becomes complex

3. **No Local Storage**: Form data not saved
   - Could add localStorage to preserve form if needed

4. **Manual Sheet Updates**: n8n must be configured to update sheet
   - Requires workflow configuration in n8n

5. **Date Formatting**: Currently hardcoded to Nov 20 - Dec 11, 2025
   - To change dates: Update generateDates() in BookingForm.tsx

## Deployment

### For GitHub + Netlify
1. Initialize git: `git init`
2. Commit changes: `git add . && git commit -m "Initial commit"`
3. Push to GitHub
4. Connect repo to Netlify
5. Netlify will auto-build from `npm run build`
6. Add env variable if needed (currently none required)

### Local Testing
```bash
npm start           # Start dev server on http://localhost:3000
npm run build       # Build for production
npm test            # Run tests (if configured)
```

## Payment Integration

**Square Payment Link**: `https://square.link/u/gbJgBAFZ`

**How It Works**:
1. Customer completes booking form
2. Booking confirmation page displays
3. Large green "Pay $200 Deposit Now" button links to Square payment
4. Opens in new tab for secure payment processing
5. Customer returns after payment completion

**Note**: Payment link is embedded in the completion page and opens in a new tab, so users don't lose their booking confirmation.

## Important Links

- **Google Sheet**: https://docs.google.com/spreadsheets/d/1BT-ArD3fpR89wx66SeT4wFuUHWUe3_XJoKQvdT4jZsY
- **n8n Webhook**: https://tagi.app.n8n.cloud/webhook/ad1dc79b-e77d-44e0-b233-2d78381beb4b
- **Square Payment Link**: https://square.link/u/gbJgBAFZ
- **GitHub Repo**: (To be created by user)
- **Netlify**: (To be deployed by user)

## Contact & Support

All development completed with Claude Code. For questions about the implementation, refer to this file and the component comments.
