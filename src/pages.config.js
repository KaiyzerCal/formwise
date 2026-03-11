/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Analytics from './pages/Analytics';
import FormCheck from './pages/FormCheck';
import FormHistory from './pages/FormHistory';
import LiveSession from './pages/LiveSession';
import MovementLibraryPage from './pages/MovementLibraryPage';
import ProperFormDemo from './pages/ProperFormDemo';
import SessionHistory from './pages/SessionHistory';
import TechniqueCompare from './pages/TechniqueCompare';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Analytics": Analytics,
    "FormCheck": FormCheck,
    "FormHistory": FormHistory,
    "LiveSession": LiveSession,
    "MovementLibraryPage": MovementLibraryPage,
    "ProperFormDemo": ProperFormDemo,
    "SessionHistory": SessionHistory,
    "TechniqueCompare": TechniqueCompare,
}

export const pagesConfig = {
    mainPage: "FormCheck",
    Pages: PAGES,
    Layout: __Layout,
};