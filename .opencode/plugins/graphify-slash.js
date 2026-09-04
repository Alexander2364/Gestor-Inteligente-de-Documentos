// graphify slash commands for OpenCode
import { join } from "path";
import { spawn } from "child_process";

export const GraphifySlashCommand = ({ directory }) => {
  return {
    "command.register": () => {
      return {
        name: "graphify",
        description: "Interact with Graphify knowledge graph",
        args: [
          {
            name: "subcommand",
            description: "Subcommand to run",
            required: true,
            suggestions: ["query", "extract", "path", "explain", "god-nodes", "affected", "benchmark"],
            type: "string"
          },
          {
            name: "args",
            description: "Arguments for subcommand",
            required: false,
            type: "string",
            variadic: true
          }
        ],
        async execute({ subcommand, args }) {
          const graphifyPath = join(directory, "..", "graphify", ".venv", "bin", "graphify");
          const cmdArgs = [subcommand, ...args];
          
          return new Promise((resolve, reject) => {
            const proc = spawn(graphifyPath, cmdArgs, {
              cwd: directory,
              stdio: ["inherit", "pipe", "pipe"]
            });
            
            let stdout = "";
            let stderr = "";
            
            proc.stdout.on("data", (data) => { stdout += data.toString(); });
            proc.stderr.on("data", (data) => { stderr += data.toString(); });
            
            proc.on("close", (code) => {
              if (code === 0) {
                resolve(stdout || "Comando ejecutado exitosamente");
              } else {
                reject(new Error(stderr || `Proceso terminó con código ${code}`));
              }
            });
            
            proc.on("error", (err) => {
              reject(new Error(`Error ejecutando graphify: ${err.message}`));
            });
          });
        }
      }
    }
  };
};

export default GraphifySlashCommand;
