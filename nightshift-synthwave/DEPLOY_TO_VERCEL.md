# How to Deploy to Vercel (Subdomain Strategy)

Since you manage your domain (`vessl.space`) on Vercel, the easiest and most professional way to host this app is on a **subdomain**, like:
👉 **`nightshift.vessl.space`**

This keeps it separate from your main site but still part of your brand.

## Option 1: Using the Command Line (Fastest)

1.  **Install Vercel CLI** (if you haven't yet):
    ```bash
    npm install -g vercel
    ```

2.  **Login**:
    ```bash
    vercel login
    ```

3.  **Deploy**:
    Inside the `nightshift-synthwave` folder, run:
    ```bash
    vercel
    ```

4.  **Follow the Prompts**:
    -   Set up and deploy? **Yes**
    -   Which scope? **(Select your team/account)**
    -   Link to existing project? **No**
    -   Project Name: **nightshift-synthwave**
    -   Directory? **./** (default)
    -   *It will auto-detect Vite settings.*

5.  **Assign the Domain**:
    -   Once deployed, go to your **Vercel Dashboard**.
    -   Click on the new **nightshift-synthwave** project.
    -   Go to **Settings** > **Domains**.
    -   Type `nightshift.vessl.space` and click **Add**.
    -   *Vercel will automatically configure the DNS since you bought the domain there.*

## Option 2: Using GitHub (Automatic Updates)

1.  Create a new repository on GitHub (e.g., `nightshift-synthwave`).
2.  Push this code to it.
3.  Go to the Vercel Dashboard and click **"Add New..."** > **Project**.
4.  Import the `nightshift-synthwave` repo.
5.  After it deploys, go to **Settings** > **Domains** and add `nightshift.vessl.space`.

## Why not `vessl.space/nightshift`?
Hosting on a subpath (like `/nightshift`) is complicated because it requires your *main* website to act as a proxy or router for this separate app. A subdomain (`nightshift.vessl.space`) is treated as a standalone app, which is much simpler and less prone to breaking your main site.
