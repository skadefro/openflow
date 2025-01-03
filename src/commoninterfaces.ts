import { Base } from "@openiap/nodeapi";
import { Ace } from "@openiap/openflow-api";
import { Histogram, HrTime, Meter, Span } from "@opentelemetry/api";
import express from "express";

export interface i_license_data {
    licenseVersion: number;
    email: string;
    expirationDate: Date;
    domain: string;
}
export interface i_license_file {
    template_v1: string;
    template_v2: string;
    license_public_key: string;
    validlicense: boolean;
    licenserror: string;
    data: i_license_data;
    ofid(force: boolean): any;
    validate(): Promise<void>;
    shutdown(): void;
    /**
     *  Generate license file
     *
     * @param options
    */
    generate2(options: any, remoteip: string, user: User, span: Span): Promise<any>;
    /**
     *  Generate license file
     *
     * @param options
     * @param options.data {object|string} - data to sign
     * @param options.template - custom license file template
     * @param [options.privateKeyPath] {string} - path to private key
     * @param [options.privateKey] {string} - private key content
     */
    generate(options: any): any;
    /**
     * Parse license file
     *
     * @param options
     * @param options.template - custom license file template
     * @param [options.publicKeyPath] {string} - path to public key
     * @param [options.publicKey] {string} - path to public key
     * @param [options.licenseFilePath] {string} - path to license file
     * @param [options.licenseFile] {string} - license file content
     */
    parse(options: any): {
        valid: boolean;
        serial: string;
        data: {};
    };
    /**
     *
     * @param options
     * @param options.data
     * @param options.privateKey
     * @private
     */
    _generateSerial(options: any): string;
    _render(template: any, data: any): any;
    _prepareDataObject(data: any): {};
}
export interface i_otel {
    default_boundaries: number[];
    meter: Meter;
    defaultlabels: any;
    GetTraceSpanId(span: Span): [string, string]
    startSpan(name: string, traceId: string, spanId: string): Span;
    startSpanExpress(name: string, req: express.Request): Span;
    startSubSpan(name: string, parent: Span): Span;
    endSpan(span: Span): void;
    startTimer(): HrTime;
    endTimer(startTime: HrTime, recorder: Histogram, labels?: Object): number;
    setdefaultlabels(): void;
    shutdown(): Promise<void>;
    createheapdump(parent: Span): Promise<string>
}

export interface i_agent_driver {
    detect(): Promise<boolean>;
    NodeLabels(parent: Span): Promise<any>;
    EnsureInstance(user: User, jwt:string, agent: iAgent, parent: Span): Promise<void>;
    GetInstancePods(user: User, jwt:string, agent: iAgent, getstats:boolean, parent: Span): Promise<any[]>;
    RemoveInstance(user: User, jwt:string, agent: iAgent, removevolumes: boolean, parent: Span): Promise<void>;
    GetInstanceLog(user: User, jwt:string, agent: iAgent, podname: string, parent: Span): Promise<string>;
    RemoveInstancePod(user: User, jwt:string, agent: iAgent, podname: string, parent: Span): Promise<void>;
    InstanceCleanup(parent: Span): Promise<void>;
}

export interface iBase {
    _id: string;
    _type: string;
    _acl: Ace[];
    name: string;
    _name: string;
    _encrypt: string[];
    _createdbyid: string;
    _createdby: string;
    _created: Date;
    _modifiedbyid: string;
    _modifiedby: string;
    _modified: Date;
    _version: number;
    constructor();
}
export interface iAgentVolume {
    type: string;
    name: string;
    mountpath: string;
    storageclass: string;
    driver: string;
    size: string;
    subPath: string;
}
export interface iAgentPort {
    name: string;
    port: number;
    protocol: "TCP" | "UDP" | "H2C" | "HTTP";
    targetport: number;
    nodeport: number;
}
export interface iAgent extends iBase {
    slug: string;
    tz: string;
    image: string;
    port: number;
    volumes: iAgentVolume[];
    ports: iAgentPort[];
    agentid: string;
    webserver: boolean;
    sleep: boolean;
    stripeprice: string;
    runas: string;
    runasname: string;
    environment: any;
    nodeselector: any;
    lastseen: Date;
    hostname: string;
    os: string;
    arch: string;
    username: string;
    version: string;
    maxpackages: number;
    package: string;
    languages: string[];
    chrome: boolean;
    chromium: boolean;
    docker: boolean;
    assistant: boolean;
    daemon: boolean;
constructor();
}

export declare class FederationId {
    constructor(id: string, issuer: string);
    id: string;
    issuer: string;
}
export declare class Rolemember {
    constructor(name: string, _id: string);
    name: string;
    _id: string;
}
export declare class TokenUser {
    _type: string;
    _id: string;
    name: string;
    username: string;
    roles: Rolemember[];
    role: string;
    email: string;
    impostor: string;
    disabled: boolean;
    validated: boolean;
    emailvalidated: boolean;
    formvalidated: boolean;
    customerid: string;
    selectedcustomerid: string;
    dblocked: boolean;
    static From(user: User | TokenUser): TokenUser;
    static assign<T>(o: T): T;
    HasRoleName(name: string): boolean;
    HasRoleId(id: string): boolean;
}
declare class User extends Base {
    constructor();
    static assign<T>(o: any): T;
    noderedname: string;
    lastseen: Date;
    _heartbeat: Date;
    _rpaheartbeat: Date;
    _noderedheartbeat: Date;
    _powershellheartbeat: Date;
    _lastclientagent: string;
    _lastclientversion: string;
    _lastopenrpaclientversion: string;
    _lastnoderedclientversion: string;
    _lastpowershellclientversion: string;
    _hasbilling: boolean;
    username: string;
    passwordhash: string;
    sid: string;
    customerid: string;
    selectedcustomerid: string;
    firebasetoken: string;
    onesignalid: string;
    gpslocation: any;
    device: any;
    impersonating: string;
    federationids: FederationId[];
    roles: Rolemember[];
    role: string;
    email: string;
    company: string;
    disabled: boolean;
    validated: boolean;
    emailvalidated: boolean;
    formvalidated: boolean;
    dbusage: number;
    dblocked: boolean;
    HasRoleName(name: string): boolean;
    HasRoleId(id: string): boolean;
}
