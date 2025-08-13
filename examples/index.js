import "./index.css";
import "./portal.js";
import { Elm } from "./src/Main.elm";

Elm.Main.init({ node: document.getElementById("app") });
