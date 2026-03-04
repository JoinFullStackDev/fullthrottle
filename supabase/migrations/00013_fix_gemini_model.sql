UPDATE agents SET default_model = 'gemini-2.5-flash'
WHERE provider = 'google' AND default_model = 'gemini-2.0-flash';
