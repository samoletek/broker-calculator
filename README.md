# Broker Calculator

Broker Calculator is a web application that estimates the cost of transporting a vehicle across the United States. It calculates a shipping quote by taking into account various factors such as route distance, vehicle type and value, weather conditions, traffic, toll costs, fuel price adjustments, and selected additional services.

## How It Works

### User Input
- **Shipping Date:** Users choose the desired shipping date.
- **Addresses:** Pickup and delivery addresses are entered with Google Maps autocomplete.
- **Transport & Vehicle Options:** Users select a transport type, vehicle type, and vehicle value from dropdown menus. Additional services (e.g., premium, special load, inoperable) can be toggled on.

### Data Processing and Price Calculation
1. **Route Calculation:**  
   The application uses the Google Maps API to generate the best route between the pickup and delivery locations. It calculates the total distance and estimates travel time.

2. **Base Price Determination:**  
   - For short routes (below a set threshold, e.g., 300 miles), a fixed base price (such as $600) is applied.  
   - For longer routes, the base price is computed based on the distance and the chosen transport type.

3. **Price Adjustments Using Multipliers:**  
   The base price is then adjusted by applying several multipliers, each reflecting the impact of a specific factor:
   - **Vehicle Multiplier:** Adjusts the price based on the vehicle's value category.
   - **Weather Multiplier:** Modifies the price if adverse weather conditions are detected along the route.
   - **Traffic Multiplier:** Accounts for potential delays due to heavy traffic.
   - **Auto Show Multiplier:** Increases the cost if there are auto show events near the pickup or delivery locations.
   - **Fuel Multiplier:** Reflects changes in fuel prices along the route.
   
   Each multiplier is applied by calculating the difference between the multiplier and one, multiplying that by the base price, and then summing all these impacts to adjust the overall cost.

4. **Additional Services and Toll Costs:**  
   - **Additional Services:** Selected extra options add a fixed percentage to the base price.
   - **Toll Costs:** The system estimates toll fees along the route and adds them to the final price.

5. **Final Price Calculation:**  
   The final shipping cost is the sum of the base price, all adjustment impacts (from multipliers), additional services charges, and toll costs.

### Results Display
- **Detailed Breakdown:**  
  The app provides a comprehensive breakdown of the calculation, showing the base price, the contribution of each multiplier, toll charges, and additional service fees.
- **Summary:**  
  A final price is presented along with key details like the shipping date and route information.
- **Next Steps:**  
  Users can save their quote for future reference or proceed to booking if all required information is complete.

## Technologies

- **Framework:** Next.js, React, TypeScript
- **APIs:** Google Maps API (for routes and address autocomplete), Weather API
- **Styling:** Tailwind CSS
- **Utilities:** Custom hooks and utility functions for calculations, validation, and navigation
