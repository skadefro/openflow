import * as path from "path";
import * as winston from "winston";
import * as http from "http";
import * as https from "https";
import * as express from "express";
import * as compression from "compression";
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as nodered from "node-red";
import * as morgan from "morgan";

// import * as samlauth from "./node-red-contrib-auth-saml";
import * as cookieSession from "cookie-session";

import { nodered_settings } from "./nodered_settings";
import { Config } from "./Config";
import { noderedcontribopenflowstorage, noderednpmrc } from "./node-red-contrib-openflow-storage";
import { noderedcontribmiddlewareauth } from "./node-red-contrib-middleware-auth";

import * as passport from "passport";
import { noderedcontribauthsaml } from "./node-red-contrib-auth-saml";
import { WebSocketClient, NoderedUtil, Message } from "@openiap/openflow-api";
import { otel } from "./otel";
import { ValueRecorder, Counter, BaseObserver } from "@opentelemetry/api-metrics"
import { HrTime, Span } from "@opentelemetry/api";

export class log_message_node {
    public span: Span;
    public end: HrTime;
    public event: string;
}
export class log_message {
    public timestamp: Date;
    public span: Span;
    public nodes: { [key: string]: log_message_node; } = {};
    // public nodes: object = {}
    constructor(msgid, name) {
        this.timestamp = new Date();
        this.nodes = {};
        this.span = otel.startSpan2(name, msgid);
    }
}

export class WebServer {
    private static _logger: winston.Logger;
    private static app: express.Express = null;

    public static openflow_nodered_node_activations: Counter;
    public static openflow_nodered_node_duration: ValueRecorder;
    public static message_queue_count: BaseObserver;

    // public static openflow_nodered_nodeid_duration = new client.Histogram({
    //     name: 'openflow_nodered_nodeid_duration',
    //     help: 'Duration of each node call',
    //     labelNames: ["nodetype", "nodeid"]
    // })

    public static log_messages: { [key: string]: log_message; } = {};
    // public static log_messages: Record<string, log_message> = {};
    // public static spans: any = {};
    private static settings: nodered_settings = null;
    static async configure(logger: winston.Logger, socket: WebSocketClient, _otel: otel): Promise<http.Server> {
        this._logger = logger;

        const options: any = null;
        const RED: nodered.Red = nodered;

        if (this.app !== null) { return; }

        if (!NoderedUtil.IsNullUndefinded(_otel)) {
            this.openflow_nodered_node_activations = _otel.meter.createCounter("openflow_nodered_node_activations", {
                description: 'Total number of node type activations calls'
            }) // "nodetype"

            this.openflow_nodered_node_duration = _otel.meter.createValueRecorder('openflow_nodered_node_duration', {
                description: 'Duration of each node type call',
                boundaries: otel.default_boundaries
            }); // "nodetype"
            this.message_queue_count = _otel.meter.createUpDownSumObserver("openflow_message_queue_count", {
                description: 'Total number messages waiting on reply from client'
            }) // "command"

        }

        try {
            this._logger.debug("WebServer.configure::begin");
            let server: http.Server = null;
            if (this.app === null) {
                this.app = express();

                const hostname = Config.getEnv("HOSTNAME", null);
                const defaultLabels: any = {};
                if (!NoderedUtil.IsNullEmpty(hostname)) defaultLabels["hostname"] = hostname;
                const name = Config.getEnv("nodered_id", null);
                if (!NoderedUtil.IsNullEmpty(name)) defaultLabels["name"] = name;
                if (NoderedUtil.IsNullEmpty(name)) defaultLabels["name"] = hostname;
                this._logger.debug("WebServer.configure::configure register");
                const loggerstream = {
                    write: function (message, encoding) {
                        logger.silly(message);
                    }
                };
                this._logger.debug("WebServer.configure::setup express middleware");
                this.app.use(morgan('combined', { stream: loggerstream }));
                this.app.use(compression());
                this.app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }))
                this.app.use(bodyParser.json({ limit: '10mb' }))
                this.app.use(cookieParser());
                this.app.use("/", express.static(path.join(__dirname, "/public")));

                this.app.use(passport.initialize());
                this.app.use(passport.session());
                passport.serializeUser(async function (user: any, done: any): Promise<void> {
                    done(null, user);
                });
                passport.deserializeUser(function (user: any, done: any): void {
                    done(null, user);
                });
                if (Config.tls_crt != '' && Config.tls_key != '') {
                    this._logger.debug("WebServer.configure::configure ssl");
                    let options: any = {
                        cert: Config.tls_crt,
                        key: Config.tls_key
                    };
                    if (Config.tls_crt.indexOf("---") == -1) {
                        options = {
                            cert: Buffer.from(Config.tls_crt, 'base64').toString('ascii'),
                            key: Buffer.from(Config.tls_key, 'base64').toString('ascii')
                        };
                    }
                    let ca: string = Config.tls_ca;
                    if (ca !== "") {
                        if (ca.indexOf("---") === -1) {
                            ca = Buffer.from(ca, 'base64').toString('ascii');
                        }
                        if (ca.indexOf("---") > -1) {
                            options.ca = ca;
                        }
                        // options.cert += "\n" + ca;
                    }
                    if (Config.tls_passphrase !== "") {
                        options.passphrase = Config.tls_passphrase;
                    }
                    this._logger.debug("WebServer.configure::create https server");
                    server = https.createServer(options, this.app);

                    const redirapp = express();
                    // const _http = http.createServer(redirapp);
                    redirapp.get('*', function (req, res) {
                        // res.redirect('https://' + req.headers.host + req.url);
                        res.status(200).json({ status: "ok" });
                    })
                    // _http.listen(80);
                } else {
                    this._logger.debug("WebServer.configure::create http server");
                    server = http.createServer(this.app);
                }
                server.on("error", (error) => {
                    this._logger.error(error);
                });

                this._logger.debug("WebServer.configure::configure nodered settings");
                this.settings = new nodered_settings();
                const c = Config;
                if (Config.nodered_port > 0) {
                    this.settings.uiPort = Config.nodered_port;
                }
                else {
                    this.settings.uiPort = Config.port;
                }
                setInterval(() => {
                    const keys = Object.keys(WebServer.log_messages);
                    keys.forEach(key => {
                        const msg = WebServer.log_messages[key];
                        var from = new Date(msg.timestamp);
                        const now = new Date();
                        const seconds = (now.getTime() - from.getTime()) / 1000;
                        if (seconds > Config.otel_trace_max_node_time_seconds) {
                            const keys = Object.keys(msg.nodes);
                            for (let i = 0; i < keys.length; i++) {
                                const nodemessage = msg.nodes[keys[i]];
                                if (nodemessage.span) otel.endSpan(nodemessage.span, msg.timestamp);
                                if (nodemessage.end) otel.endTimer(nodemessage.end, WebServer.openflow_nodered_node_duration, { nodetype: nodemessage.event });
                            }
                            if (msg.span) {
                                otel.endSpan(msg.span, msg.timestamp);
                                delete msg.span;
                            }
                            delete WebServer.log_messages[key];
                            console.log("Ending " + key)
                        }
                    });
                }, 1000)
                this.settings.logging.customLogger = {
                    level: 'debug',
                    metrics: true,
                    handler: function (settings) {
                        return function (msg) {
                            try {
                                if (!NoderedUtil.IsNullEmpty(msg.msgid) && msg.event.startsWith("node.")) {
                                    msg.event = msg.event.substring(5);
                                    if (msg.event.endsWith(".receive")) {
                                        msg.event = msg.event.substring(0, msg.event.length - 8);
                                        if (!NoderedUtil.IsNullUndefinded(WebServer.openflow_nodered_node_activations))
                                            WebServer.openflow_nodered_node_activations.bind({ ...otel.defaultlabels, nodetype: msg.event }).add(1);

                                        if (WebServer.log_messages[msg.msgid] == undefined) WebServer.log_messages[msg.msgid] = new log_message(msg.msgid, msg.event);
                                        const logmessage = WebServer.log_messages[msg.msgid];
                                        if (!logmessage.nodes[msg.nodeid]) logmessage.nodes[msg.nodeid] = new log_message_node();
                                        logmessage.timestamp = new Date();

                                        const nodemessage = logmessage.nodes[msg.nodeid];

                                        // const span: Span = logmessage.span || otel.startSpan2(msg.event, msg.msgid);
                                        // logmessage.span = span;

                                        nodemessage.span = otel.startSubSpan(msg.event, logmessage.span);
                                        nodemessage.span.setAttributes(otel.defaultlabels);
                                        // nodemessage.span = otel.startSpan2(msg.event, msg.msgid);
                                        nodemessage.end = otel.startTimer();
                                        nodemessage.event = msg.event;
                                    }
                                    if (msg.event.endsWith(".send")) {
                                        msg.event = msg.event.substring(0, msg.event.length - 5);
                                        if (WebServer.log_messages[msg.msgid] == undefined) WebServer.log_messages[msg.msgid] = new log_message(msg.msgid, msg.event);
                                        const logmessage = WebServer.log_messages[msg.msgid];
                                        if (!logmessage.nodes[msg.nodeid]) logmessage.nodes[msg.nodeid] = new log_message_node();
                                        logmessage.timestamp = new Date();

                                        const nodemessage = logmessage.nodes[msg.nodeid];

                                        if (nodemessage.span) {
                                            otel.endSpan(nodemessage.span); delete nodemessage.span;
                                        } else {
                                            nodemessage.span = otel.startSubSpan(msg.event, logmessage.span);
                                            nodemessage.span.setAttributes(otel.defaultlabels);
                                            // nodemessage.span = otel.startSpan2(msg.event, msg.msgid);
                                        }
                                        if (nodemessage.end) {
                                            otel.endTimer(nodemessage.end, WebServer.openflow_nodered_node_duration, { nodetype: nodemessage.event });
                                            delete nodemessage.end;
                                        } else {
                                            nodemessage.end = otel.startTimer();
                                        }
                                        nodemessage.event = msg.event;
                                    }
                                    if (msg.event.endsWith(".done")) {
                                        msg.event = msg.event.substring(0, msg.event.length - 5);
                                        if (WebServer.log_messages[msg.msgid] == undefined) return;
                                        const logmessage = WebServer.log_messages[msg.msgid];
                                        if (!logmessage.nodes[msg.nodeid]) return;
                                        logmessage.timestamp = new Date();

                                        const nodemessage = logmessage.nodes[msg.nodeid];
                                        if (nodemessage.span) { otel.endSpan(nodemessage.span); delete nodemessage.span; }
                                        if (nodemessage.end) { otel.endTimer(nodemessage.end, WebServer.openflow_nodered_node_duration, { nodetype: nodemessage.event }); delete nodemessage.end; }
                                        nodemessage.event = msg.event;
                                    }
                                }
                            } catch (error) {
                                console.trace(error);
                                console.error(error);
                                WebServer._logger.error(error);
                            }

                        }
                    }
                }



                this.settings.userDir = path.join(Config.logpath, '.nodered-' + Config.nodered_id)
                this.settings.nodesDir = path.join(__dirname, "./nodered");

                const baseurl = (!NoderedUtil.IsNullEmpty(Config.saml_baseurl) ? Config.saml_baseurl : Config.baseurl());
                this.settings.adminAuth = await noderedcontribauthsaml.configure(baseurl, Config.saml_federation_metadata, Config.saml_issuer,
                    (profile: string | any, done: any) => {
                        const roles: string[] = profile["http://schemas.xmlsoap.org/claims/Group"];
                        if (roles !== undefined) {
                            if (Config.noderedusers !== "") {
                                if (roles.indexOf(Config.noderedusers) !== -1 || roles.indexOf(Config.noderedusers) !== -1) { profile.permissions = "read"; }
                            }
                            if (Config.noderedadmins !== "") {
                                if (roles.indexOf(Config.noderedadmins) !== -1 || roles.indexOf(Config.noderedadmins) !== -1) { profile.permissions = "*"; }
                            }
                        }
                        // profile.permissions = "*";
                        done(profile);
                    }, "", Config.saml_entrypoint, null);
                this.settings.httpNodeMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
                    noderedcontribmiddlewareauth.process(socket, req, res, next);
                };

                this._logger.debug("WebServer.configure::configure nodered storageModule");
                this.settings.storageModule = new noderedcontribopenflowstorage(logger, socket);
                const n: noderednpmrc = await this.settings.storageModule._getnpmrc();
                if (!NoderedUtil.IsNullUndefinded(n) && !NoderedUtil.IsNullUndefinded(n.catalogues)) {
                    this.settings.editorTheme.palette.catalogues = n.catalogues;
                } else {
                    this.settings.editorTheme.palette.catalogues = ['https://catalogue.nodered.org/catalogue.json'];
                }

                this.settings.ui.path = "ui";
                // this.settings.ui.middleware = new dashboardAuth();
                this.settings.ui.middleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
                    noderedcontribmiddlewareauth.process(socket, req, res, next);
                    // if (req.isAuthenticated()) {
                    //     next();
                    // } else {
                    //     passport.authenticate("uisaml", {
                    //         successRedirect: '/ui/',
                    //         failureRedirect: '/uisaml/',
                    //         failureFlash: false
                    //     })(req, res, next);
                    // }
                };


                this.app.use(cookieSession({
                    name: 'session', secret: Config.cookie_secret
                }))

                this._logger.debug("WebServer.configure::init nodered");
                // initialise the runtime with a server and settings
                await (RED as any).init(server, this.settings);

                // serve the editor UI from /red
                this.app.use(this.settings.httpAdminRoot, RED.httpAdmin);

                // serve the http nodes UI from /api
                this.app.use(this.settings.httpNodeRoot, RED.httpNode);

                this.app.get("/livenessprobe", (req: any, res: any, next: any): void => {
                    res.end(JSON.stringify({ "success": "true" }));
                    res.end();
                });

                if (Config.nodered_port > 0) {
                    this._logger.debug("WebServer.configure::server.listen on port " + Config.nodered_port);
                    server.listen(Config.nodered_port).on('error', function (error) {
                        WebServer._logger.error(error);
                    });
                }
                else {
                    this._logger.debug("WebServer.configure::server.listen on port " + Config.port);
                    server.listen(Config.port).on('error', function (error) {
                        WebServer._logger.error(error);
                    });
                }

            } else {
                await RED.stop();
                // initialise the runtime with a server and settings
                await (RED as any).init(server, this.settings);

                // serve the editor UI from /red
                this.app.use(this.settings.httpAdminRoot, RED.httpAdmin);

                // serve the http nodes UI from /api
                this.app.use(this.settings.httpNodeRoot, RED.httpNode);
            }

            let hasErrors: boolean = true, errorCounter: number = 0, err: any;
            while (hasErrors) {
                try {
                    this._logger.debug("WebServer.configure::restarting nodered ...");
                    RED.start();
                    hasErrors = false;
                } catch (error) {
                    err = error;
                    errorCounter++;
                    hasErrors = true;
                    this._logger.error(error);
                }
                if (errorCounter == 10) {
                    throw err;
                } else if (hasErrors) {
                    const wait = ms => new Promise((r, j) => setTimeout(r, ms));
                    await wait(2000);
                }
            }
            return server;
        } catch (error) {
            this._logger.error(error);
            this._logger.error("WEBSERVER ERROR");
            // process.exit(404);
        }
        return null;
    }
    public static update_message_queue_count(cli: WebSocketClient) {
        if (!Config.prometheus_measure_queued_messages) return;
        if (!WebServer.message_queue_count) return;
        const result: any = {};
        const keys = Object.keys(cli.messageQueue);
        keys.forEach(key => {
            try {
                const qmsg = cli.messageQueue[key];
                var o = qmsg.message;
                if (typeof o === "string") o = JSON.parse(o);
                const msg: Message = o;
                if (result[msg.command] == null) result[msg.command] = 0;
                result[msg.command]++;
            } catch (error) {
                WebServer._logger.error(error);
            }
        });
        const keys2 = Object.keys(result);
        WebServer.message_queue_count.clear();
        keys2.forEach(key => {
            WebServer.message_queue_count.bind({ ...otel.defaultlabels, command: key }).update(result[key]);
        });
    }
}