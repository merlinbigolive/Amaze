Amaze Vacation Professional v5

Global autocomplete upgrade:
- Flights: global airport database loaded from OpenFlights; city + IATA/ICAO + country + airport name.
- Trains: Indian railway station directory with 8,990+ stations from Indian-Railway-Data; station name + code + state/address.
- Hotels/Cars: city suggestions derived from the global airport-city dataset, with country.
- Data is loaded once in the browser and cached in localStorage for faster subsequent searches.
- Small fallback list remains if a data source is temporarily unavailable.

Important: these are location suggestions only. Live schedules, availability, prices and booking still require travel supplier APIs.
