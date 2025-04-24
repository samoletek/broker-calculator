# Broker Calculator

Broker Calculator is a web application for estimating vehicle transportation costs across the United States. It calculates accurate shipping prices by considering multiple factors, including route distance, vehicle type and value, weather conditions, traffic congestion, toll costs, fuel price adjustments, and selected additional services.

## Key Features

- Interactive UI with responsive design
- Real-time route calculation and visualization using Google Maps API
- Dynamic weather conditions analysis along the route
- Traffic analysis and impact on delivery time and cost
- Auto show event detection near pickup/delivery locations
- Fuel price variations consideration along the route
- Detailed price breakdown with multiple factors
- Email quote delivery functionality
- Security protections for API endpoints
- Seamless integration with booking system
- Dark theme support
- Full responsive design
- DDoS protection with reCAPTCHA and rate limiting

## How It Works

### User Input
- **Shipping Date:** Users choose the desired shipping date with an interactive calendar.
- **Addresses:** Pickup and delivery addresses are entered with Google Maps autocomplete for accuracy.
- **Transport & Vehicle Options:** Users select a transport type (open/enclosed), vehicle type, and vehicle value from dropdown menus.
- **Additional Services:** Optional premium enhancements, special load handling, and inoperable vehicle services can be toggled on.
- **Contact Information:** Users provide their name, phone, and email for quote delivery and booking purposes.

### Data Processing and Price Calculation

1. **Route Calculation:**  
   The application uses the Google Maps API to generate the best route between the pickup and delivery locations, calculating total distance and estimating travel time.

2. **Base Price Determination:**  
   - For short routes (below 300 miles), a fixed base price is applied.  
   - For longer routes, the base price is computed based on the distance and the chosen transport type.

3. **Price Adjustments Using Multipliers:**  
   The base price is then adjusted by applying several multipliers, each reflecting the impact of a specific factor:
   - **Vehicle Multiplier:** Adjusts the price based on the vehicle's value category.
   - **Weather Multiplier:** Modifies the price if adverse weather conditions are detected along the route.
   - **Traffic Multiplier:** Accounts for potential delays due to heavy traffic.
   - **Auto Show Multiplier:** Increases the cost if there are auto show events near the pickup or delivery locations.
   - **Fuel Multiplier:** Reflects changes in fuel prices along the route.

4. **Additional Services and Toll Costs:**  
   - **Premium Enhancements:** Required for high-value vehicles, adds additional service level.
   - **Special Load:** For non-standard transportation needs.
   - **Inoperable Vehicles:** Additional handling for vehicles that cannot be driven.
   - **Toll Costs:** The system estimates toll fees along the route based on segment analysis.

5. **Final Price Calculation:**  
   The final shipping cost is the sum of the base price, all adjustment impacts (from multipliers), additional services charges, and toll costs.

### Results Display
- **Interactive Map:** Shows the calculated route from pickup to delivery.
- **Weather Conditions:** Displays current or forecasted weather at pickup, mid-route, and delivery locations.
- **Route Information:** Provides details about distance, estimated delivery time, traffic conditions, and toll segments.
- **Detailed Price Breakdown:** Shows the base price, the contribution of each multiplier, toll charges, and additional service fees.
- **Price Summary:** Presents the final price with options to receive it via email or proceed to booking.

## Pricing Formula

### Base Multipliers
- **Transport Type** (open/enclosed):
  - Open Transport: $0.62-0.93 per mile
  - Enclosed Transport: $0.88-1.19 per mile (approx. 30-40% more expensive than open)

- **Vehicle Value**:
  - Under $100k: +0% (multiplier 1.0)
  - $100k - $300k: +5% (multiplier 1.05)
  - $300k - $500k: +10% (multiplier 1.1)
  - Over $500k: +15% (multiplier 1.15)

- **Distance**:
  - Less than 300 miles: fixed price of $600
  - More than 300 miles: distance * cost per mile for selected transport type

### Additional Multipliers
- **Weather Conditions**:
  - Clear/Cloudy: +0% (multiplier 1.0)
  - Rain: +5% (multiplier 1.05)
  - Snow: +20% (multiplier 1.2)
  - Storm: +15% (multiplier 1.15)

- **Traffic**:
  - Light: +0% (multiplier 1.0)
  - Moderate: +10% (multiplier 1.1) 
  - Heavy: +20% (multiplier 1.2)

- **Auto Show Nearby**: +10% (multiplier 1.1)

- **Fuel Price**: up to +5% (multiplier up to 1.05)

- **Additional Services**:
  - Premium Enhancements: +30% (multiplier 0.3)
  - Special Load: +30% (multiplier 0.3)
  - Inoperable Vehicle: +30% (multiplier 0.3)
  - Supplementary Insurance: +5% (multiplier 0.05)

### Additional Features
- For vehicles valued at $300k or above, premium services are automatically included
- Toll roads are calculated separately and added to the total cost
- For routes over 1000 miles, a 10% discount is applied
- For routes over 2000 miles, an additional 15% discount is applied

## Technologies

- **Framework:** Next.js, React, TypeScript
- **API Integration:** Google Maps API, Weather API
- **Styling:** Tailwind CSS with custom configurations
- **UI Components:** Custom components with animations and intuitive interactions
- **Forms:** Enhanced form handling with validation and interactive elements
- **Security System:** reCAPTCHA, CSRF protection, rate limiting

## Project Structure

The application follows a modular architecture with clear separation of concerns:

- Client-side interactive components
- Server-side rendered components
- Reusable UI elements
- Custom React hooks for core functionality
- Utility functions for various operations
- TypeScript type definitions
- API route handlers

For a complete directory structure, see `STRUCTURE.TREE.md`.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.