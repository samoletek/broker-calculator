# Broker Calculator Project Structure

```
broker-calculator/
│── .next/                              # Generated Next.js files
│── node_modules/                       # npm dependencies
│── public/                             # Static assets
│   ├── file.svg                        # File icon SVG
│   ├── globe.svg                       # Globe icon SVG
│   ├── next.svg                        # Next.js logo SVG
│   ├── vercel.svg                      # Vercel logo SVG
│   └── window.svg                      # Window icon SVG
│── src/                                # Source code
│   ├── app/                            # Main Next.js app
│   │   ├── api/                        # API endpoints
│   │   │   ├── captcha/                # reCAPTCHA API
│   │   │   │   └── route.ts            # reCAPTCHA handler
│   │   │   ├── csrf/                   # CSRF token API
│   │   │   │   └── route.ts            # CSRF token generation/validation
│   │   │   ├── email/                  # Email API
│   │   │   │   └── route.ts            # Email sending handler
│   │   │   ├── maps/                   # Maps API
│   │   │   │   └── route.ts            # Secure access to Google Maps API
│   │   │   ├── verify-recaptcha/       # reCAPTCHA verification API
│   │   │   │   └── route.ts            # reCAPTCHA token verifier
│   │   │   ├── weather/                # Weather API
│   │   │   │   └── route.ts            # Weather data fetcher
│   │   │   └── middleware.ts           # API protection middleware
│   │   ├── components/                 # React components
│   │   │   ├── client/                 # Client-side components
│   │   │   │   ├── DatePicker.tsx      # Date selection component
│   │   │   │   ├── GoogleMap.tsx       # Google Maps component
│   │   │   │   ├── SimpleCaptcha.tsx   # Simple captcha fallback
│   │   │   │   └── WeatherConditions.tsx # Weather display component
│   │   │   ├── server/                 # Server components
│   │   │   │   ├── PriceBreakdown.tsx  # Detailed price breakdown
│   │   │   │   ├── PriceSummary.tsx    # Price summary component
│   │   │   │   └── RouteInfo.tsx       # Route information display
│   │   │   └── ui/                     # UI components
│   │   │       ├── Accordion.tsx       # Accordion component
│   │   │       ├── Button.tsx          # Button component
│   │   │       └── Select.tsx          # Select dropdown component
│   │   ├── fonts/                      # Fonts
│   │   │   ├── GeistMonoVF.woff        # Geist Mono variable font
│   │   │   └── GeistVF.woff            # Geist variable font
│   │   ├── lib/                        # Libraries and utilities
│   │   │   ├── hooks/                  # React hooks
│   │   │   │   ├── useGoogleMaps.ts    # Google Maps hook
│   │   │   │   ├── usePricing.ts       # Price calculation hook
│   │   │   │   ├── useRateLimiter.ts   # Request rate limiting hook
│   │   │   │   └── useWeather.ts       # Weather data hook
│   │   │   └── utils/                  # Utilities
│   │   │       ├── client/             # Client-side utilities
│   │   │       │   ├── autoShowsUtils.ts # Auto show utilities
│   │   │       │   ├── emailUtils.ts   # Email utilities
│   │   │       │   ├── fuelUtils.ts    # Fuel price utilities
│   │   │       │   ├── GoogleReCaptcha.tsx # reCAPTCHA component
│   │   │       │   ├── maps.ts         # Maps utilities
│   │   │       │   ├── navigation.ts   # Navigation utilities
│   │   │       │   ├── tollUtils.ts    # Toll calculation utilities
│   │   │       │   ├── transportUtils.ts # Transportation utilities
│   │   │       │   ├── utils.ts        # General utilities
│   │   │       │   ├── validation.ts   # Form validation utilities
│   │   │       │   └── weather.ts      # Weather utilities
│   │   │       └── server/             # Server-side utilities
│   │   │           └── apiUtils.ts     # API utilities
│   │   ├── styles/                     # Styles
│   │   │   ├── components.css          # Component styles
│   │   │   └── globals.css             # Global styles
│   │   ├── types/                      # TypeScript types
│   │   │   ├── api.types.ts            # API types
│   │   │   ├── booking.types.ts        # Booking types
│   │   │   ├── common.types.ts         # Common types
│   │   │   ├── components.types.ts     # Component types
│   │   │   ├── index.ts                # Types export
│   │   │   └── pricing.types.ts        # Pricing types
│   │   ├── csrf.ts                     # CSRF protection
│   │   ├── session.ts                  # Session management
│   │   ├── favicon.ico                 # Favicon
│   │   ├── layout.tsx                  # Root layout
│   │   └── page.tsx                    # Main page
│   └── constants/                      # App constants
│       └── pricing.ts                  # Pricing constants
├── .env.local                          # Local environment variables
├── .eslintrc.json                      # ESLint configuration
├── .gitignore                          # Git ignored files
├── LICENSE                             # MIT License
├── next-env.d.ts                       # Next.js types
├── next.config.ts                      # Next.js configuration
├── package.json                        # Dependencies and scripts
├── package-lock.json  
├── postcss.config.mjs                  # PostCSS configuration
├── README.md                           # Project description
├── STRUCTURE.TREE.md                   # Project structure
├── tailwind.config.ts                  # Tailwind CSS configuration
├── tsconfig.json                       # TypeScript configuration
└── middleware.ts                       # Global middleware
```

## Core Components

### Client Components
- **DatePicker**: Interactive date selection with planning hints
- **GoogleMap**: Route visualization using Google Maps API
- **WeatherConditions**: Weather conditions display along the route
- **SimpleCaptcha**: Fallback bot protection (besides reCAPTCHA)

### Server Components
- **PriceBreakdown**: Detailed breakdown of all cost components
- **PriceSummary**: Final price and options for saving/sending
- **RouteInfo**: Distance, time, and route conditions information

### UI Components
- **Accordion**: Collapsible list for improved UX
- **Button**: Reusable button with various states
- **Select**: Enhanced dropdown selection

## Key Utilities

### Client Utilities
- **autoShowsUtils**: Check for auto shows affecting price
- **emailUtils**: Email sending and formatting
- **fuelUtils**: Fuel price analysis along route
- **maps**: Google Maps API integration
- **tollUtils**: Toll road cost calculation
- **transportUtils**: Transportation time estimation and traffic analysis
- **validation**: Form and input validation
- **weather**: Weather conditions analysis and pricing impact

### Server Utilities
- **apiUtils**: External API handling and testing
- **csrf**: CSRF attack protection
- **session**: User session management

## React Hooks

- **useGoogleMaps**: Unified interface to Google Maps API
- **usePricing**: State management and price calculation
- **useRateLimiter**: Request rate limiting for attack prevention
- **useWeather**: Weather data retrieval and analysis

## API Endpoints

- **/api/captcha**: Captcha verification for bot protection
- **/api/csrf**: CSRF token generation for forms
- **/api/email**: Email calculation results
- **/api/maps**: Secure access to Google Maps API
- **/api/verify-recaptcha**: Google reCAPTCHA verification
- **/api/weather**: Weather data for route