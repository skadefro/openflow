import path from "path";
const env = path.join(process.cwd(), 'config', '.env');
import { config } from "dotenv";
config({ path: env }); // , debug: false 
