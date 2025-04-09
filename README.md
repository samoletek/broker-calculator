# Broker Calculator

Broker Calculator is a web application that estimates the cost of transporting a vehicle across the United States. It calculates a shipping quote by taking into account various factors such as route distance, vehicle type and value, weather conditions, traffic, toll costs, fuel price adjustments, and selected additional services.

## Features

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
   - For short routes (below a set threshold), a fixed base price is applied.  
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

## Technologies

- **Framework:** Next.js, React, TypeScript
- **API Integration:** Google Maps API, Weather API
- **Styling:** Tailwind CSS with custom configurations
- **UI Components:** Custom components with animations and intuitive interactions
- **Forms:** Enhanced form handling with validation and interactive elements

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