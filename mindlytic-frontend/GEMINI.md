# Project Overview

This is a Vue.js 3 single-page application (SPA) named "Mindlytic". Based on the file structure and component names, it appears to be a personal portfolio or project showcase website.

The application is built using the Vite tooling for a fast development experience. It leverages several key technologies from the Vue ecosystem:

-   **Framework:** [Vue.js](https://vuejs.org/) 3
-   **UI Toolkit:** [Vuetify](https://vuetifyjs.com/) 3, for a rich set of Material Design components.
-   **Routing:** [Vue Router](https://router.vuejs.org/) 4, for client-side navigation between pages.
-   **State Management:** [Pinia](https://pinia.vuejs.org/) for managing global application state.
-   **Build Tool:** [Vite](https://vitejs.dev/)

## Project Structure

-   `src/main.js`: The main entry point of the application where Vue, Vuetify, Pinia, and Vue Router are initialized.
-   `src/App.vue`: The root Vue component that defines the overall layout, including the header, footer, and the main content area where router views are displayed.
-   `src/router/index.js`: Defines all the application routes, including lazy-loaded pages for "Home", "About", and "Projects". It also includes nested routes for specific projects like an Image-to-PDF converter.
-   `src/pages/`: Contains the top-level components for each page/route.
-   `src/components/`: Contains reusable UI components used across the application, such as `AppHeader.vue` and `AppFooter.vue`.
-   `src/plugins/`: Configures third-party plugins like Vuetify.
-   `vite.config.mjs`: The configuration file for the Vite build tool.
-   `package.json`: Lists all project dependencies and defines the key scripts for running and building the application.

# Building and Running

This project uses `pnpm` as the package manager, inferred from the presence of `pnpm-lock.yaml`.

1.  **Install Dependencies:**
    Open a terminal in the project root and run:
    ```sh
    pnpm install
    ```

2.  **Run Development Server:**
    To start the local development server with hot-reloading:
    ```sh
    pnpm dev
    ```
    The application will be available at `http://localhost:3000` by default.

3.  **Build for Production:**
    To create a production-ready build of the application in the `dist/` directory:
    ```sh
    pnpm build
    ```

4.  **Preview Production Build:**
    To serve the production build locally for testing:
    ```sh
    pnpm preview
    ```

# Development Conventions

-   **Component-Based Architecture:** The application follows a standard component-based structure. Pages are high-level components, and `src/components` holds smaller, reusable parts.
-   **Lazy Loading Routes:** Routes are lazy-loaded for better initial performance, as seen in `src/router/index.js`.
-   **Dark Theme:** The default theme is set to "dark" in `src/App.vue`.
-   **File Aliases:** The `@` alias is configured to point to the `src/` directory for cleaner import paths.
