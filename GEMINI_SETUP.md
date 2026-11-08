# Gemini AI review setup

The Business Starter System sends plan information to Google Gemini only when a signed-in customer with a paid entitlement clicks **Generate AI review**. The API key stays on the server and is never returned to the browser.

## Local development

1. In Google AI Studio, copy the API key for your BizPilot Studio AI project. The key value is not included in source control or chat.
2. Add these entries to `.env.local` (replace the placeholder with the key):

   ```dotenv
   GEMINI_API_KEY=your_google_ai_studio_key
   GEMINI_MODEL=gemini-3.8-flash
   GEMINI_CHAT_MODEL=gemini-3.5-flash-lite
   GEMINI_TRIAL_MODEL=gemini-3.5-flash-lite
   ```

3. Restart `npm run dev` so Next.js loads the new environment variable.

If Google AI Studio does not enable that model for the key, set `GEMINI_MODEL` to a model available to the project, such as `gemini-3.5-flash`.

## Deployment

Add `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_CHAT_MODEL`, and `GEMINI_TRIAL_MODEL` as server-side environment variables in the hosting project, then redeploy. Never use a `NEXT_PUBLIC_` prefix for the key. The public homepage chatbot and free trial review default to Gemini 3.5 Flash-Lite; set their model variables to another model enabled for the project if needed.

The paid planner endpoint limits AI review requests to eight per customer per hour. Free preview users receive one complimentary review per browser trial identifier, with an additional network-level daily abuse limit. Plan details are sent only after the visitor clicks the review button. The public homepage chatbot does not require login and allows up to 20 messages per visitor IP in each 15-minute window. Google API errors are logged without logging the API key, visitor questions, or plan contents.

Before enabling free-trial AI reviews on a database, run [20261108_business_starter_free_trial.sql](database/migrations/20261108_business_starter_free_trial.sql) in Neon SQL Editor. If the original Business Starter migration has not been applied yet, run that first as well.
