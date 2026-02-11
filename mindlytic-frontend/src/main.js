// Styles
import "unfonts.css";
import "./assets/main.css";

// Components
import App from "./App.vue";

// Composables
import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router";

// Plugins
import { registerPlugins } from "@/plugins";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

registerPlugins(app);

app.mount("#app");
