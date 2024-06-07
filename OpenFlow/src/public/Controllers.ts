import AnsiUp from 'ansi_up';
const ansi_up = new AnsiUp();

import { userdata, api, entityCtrl, entitiesCtrl } from "./CommonControllers";
import { TokenUser, QueueMessage, SigninMessage, Ace, NoderedUser, stripe_base, Base, NoderedUtil, WebSocketClient, Role, NoderedConfig, stripe_invoice, Message, Customer, KubeResources, KubeResourceValues, Resource, ResourceVariant, ResourceUsage } from "@openiap/openflow-api";
import { RPAWorkflow, Provider, Form, WorkflowInstance, Workflow, unattendedclient } from "./Entities";
import { WebSocketClientService } from "./WebSocketClientService";

import * as jsondiffpatch from "jsondiffpatch";
import * as ofurl from "./formsio_of_provider";
import { AddWorkitemMessage, AddWorkitemQueueMessage, DeleteWorkitemMessage, DeleteWorkitemQueueMessage, UpdateWorkitemMessage, UpdateWorkitemQueueMessage, Workitem, WorkitemQueue } from "@openiap/openflow-api";
import { RegisterExchangeResponse } from "@openiap/openflow-api/lib/node/nodeclient/NoderedUtil";

import showdown from "showdown";

export type chatmessage = {
    role: "user" | "assistant" | "system" | "tool";
    content: string;
  }
  
declare let $: any;

function treatAsUTC(date): number {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
    return result as any;
}
function daysBetween(startDate, endDate): number {
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    return (treatAsUTC(endDate) - treatAsUTC(startDate)) / millisecondsPerDay;
}
declare const Formio: any;
declare const FileSaver: any;
export class jsutil {
    public static async ensureJQuery() {
        try {
            const ele = $('body');
        } catch (error) {
            await this.loadScript("jquery.min.js");
        }
    }
    public static async loadScript(url: string): Promise<void> {
        return new Promise<void>(async (resolve) => {
            var script = document.createElement("script")
            script.type = "text/javascript";
            script.onload = function () {
                resolve();
            };
            script.src = url;
            document.getElementsByTagName("head")[0].appendChild(script);
        });
    }
    public static async getScript(url: string): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            $.getScript(url, () => {
                resolve();
            }).fail((e1, e2, e3) => {
                if (e1.readyState == 0) {
                    reject('script failed to load');
                    //script failed to load
                } else if (e3 != null) {
                    reject(e3.toString());
                } else {
                    reject('unknonw error loading ' + url);
                }
            });
        });
    }
}
export class MenuCtrl {
    public user: TokenUser;
    public signedin: boolean = false;
    public path: string = "";
    public searchstring: string = "";
    public halfmoon: any;
    public version: string;
    public majorversion: string;
    public searchpaths: any[] = [
        "/Providers",
        "/Users",
        "/Roles",
        "/RPAWorkflows",
        "/Workflows",
        "/Forms",
        "/FormResources",
        "/Files",
        "/Entities/",
        "/Duplicates",
        "/History/",
        "/hdrobots",
        "/Clients",
        "/Auditlogs",
        "/Credentials",
        "/OAuthClients",
        "/Customers",
        "/EntityRestrictions",
        "/Resources",
        "/Workitems",
        "/Workitems/",
        "/WorkitemQueues",
        "/WebsocketClients",
        "/MailHists",
        "/Agents",
        "/Packages",
        "/ChatThreads"
    ];
    public static $inject = [
        "$rootScope",
        "$scope",
        "$location",
        "$routeParams",
        "WebSocketClientService",
        "api",
        "userdata"
    ];
    public customer: Customer;
    public customers: Customer[];
    public allowclick: boolean = true;
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {

        document.addEventListener(
        "click",
        (event) => {
            try {
                if (!this.allowclick) {
                    // event.cancelBubble = true;
                    event.stopImmediatePropagation();
                    return event.preventDefault();
                }
            } catch (error) {
                console.error(error);
            }
        });
        document.addEventListener('keydown', (event) => {
            if(!this.PathIs(this.searchpaths)) return;
            // Check if 'Ctrl' or 'Command' (for MacOS) is pressed along with 'F'
            if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
                event.preventDefault(); // Prevent the default Ctrl+F behavior
                document.getElementById('menusearch').focus(); // Focus on your search field
            }
        });
            
        this.halfmoon = require("halfmoon");
        console.debug("MenuCtrl::constructor");
        $scope.$root.$on('$routeChangeStart', (...args) => { this.routeChangeStart.apply(this, args); });
        this.path = this.$location.path();

        this.$scope.$on('search', (event, data) => {
            this.searchstring = data;
        });

        this.halfmoon.onDOMContentLoaded();
        const cleanup = this.$scope.$on('signin', async (event, data) => {
            if (event && data) { }
            this.user = data;
            this.signedin = true;

            this.version = this.WebSocketClientService.version;
            this.majorversion = this.version;
            const dotCount = this.version.split('.').length - 1;
            if(dotCount == 3){
                this.majorversion = this.version.substring(0, this.version.lastIndexOf('.'));
            }
            console.log(this.version)
        

            this.customer = this.WebSocketClientService.customer;

            this.customers = await NoderedUtil.Query({ collectionname: "users", query: { _type: "customer" }, orderby: { "name": 1 }, top: 20 });
            if (this.customers != null && !NoderedUtil.IsNullEmpty(this.user.selectedcustomerid)) {
                if (this.customers.filter(x => x._id == this.user.selectedcustomerid).length == 0) {
                    this.customers = (await NoderedUtil.Query({ collectionname: "users", query: { _type: "customer", _id: this.user.selectedcustomerid } })).concat(this.customers);
                }
            }
            if (this.customers != null && !NoderedUtil.IsNullEmpty(this.user.customerid)) {
                if (this.customers.filter(x => x._id == this.user.customerid).length == 0) {
                    this.customers = (await NoderedUtil.Query({ collectionname: "users", query: { _type: "customer", _id: this.user.customerid } })).concat(this.customers);
                }
            }
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
            this.StartNewFeaturesTour(null);
        });
        const cleanup2 = this.$scope.$on('refreshtoken', async (event, data) => {
            if (event && data) { }
            this.user = data;
            this.signedin = true;

            if (this.user.selectedcustomerid == null) {
                this.customer = null;
            } else {
                this.customer = this.WebSocketClientService.customer;
                this.customers = await NoderedUtil.Query({ collectionname: "users", query: { _type: "customer" }, orderby: { "name": 1 }, top: 20 });

                if (this.customers && !NoderedUtil.IsNullEmpty(this.user.selectedcustomerid)) {
                    if (this.customers.filter(x => x._id == this.user.selectedcustomerid).length == 0) {
                        this.customers = (await NoderedUtil.Query({ collectionname: "users", query: { _type: "customer", _id: this.user.selectedcustomerid } })).concat(this.customers);
                    }
                }
                if (this.customers && !NoderedUtil.IsNullEmpty(this.user.customerid)) {
                    if (this.customers.filter(x => x._id == this.user.customerid).length == 0) {
                        this.customers = (await NoderedUtil.Query({ collectionname: "users", query: { _type: "customer", _id: this.user.customerid } })).concat(this.customers);
                    }
                }
                if (this.customers && this.customers.length > 0) {
                    for (let cust of this.customers) {
                        if (cust._id == this.user.selectedcustomerid) {
                            this.customer = cust;
                            this.WebSocketClientService.customer = cust as any;
                        }
                    }
                    if (this.customers.length == 1) {
                        this.customer = this.customers[0];
                        this.WebSocketClientService.customer = this.customers[0] as any;
                    }
                }
            }
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
            this.StartNewFeaturesTour(null)
            // cleanup();
        });
        this.$scope.$on('setsearch', (event, data) => {
            if (event && data) { }
            this.searchstring = data;
        });
        this.$scope.$on('menurefresh', async (event, data) => {
            if (event && data) { }
            this.customer = this.WebSocketClientService.customer;
            this.customers = await NoderedUtil.Query({ collectionname: "users", query: { _type: "customer" }, orderby: { "name": 1 }, top: 20 });
            if (this.customers && !NoderedUtil.IsNullEmpty(this.user.selectedcustomerid)) {
                if (this.customers.filter(x => x._id == this.user.selectedcustomerid).length == 0) {
                    this.customers = (await NoderedUtil.Query({ collectionname: "users", query: { _type: "customer", _id: this.user.selectedcustomerid } })).concat(this.customers);
                }
            }
            if (this.customers && !NoderedUtil.IsNullEmpty(this.user.customerid)) {
                if (this.customers.filter(x => x._id == this.user.customerid).length == 0) {
                    this.customers = (await NoderedUtil.Query({ collectionname: "users", query: { _type: "customer", _id: this.user.customerid } })).concat(this.customers);
                }
            }
            if (this.customers && this.customers.length > 0) {
                for (let cust of this.customers)
                    if (cust._id == this.user.selectedcustomerid) this.customer = cust;

                if (this.customers.length == 1) {
                    this.customer = this.customers[0];
                    this.WebSocketClientService.customer = this.customers[0] as any;
                }
            }
            if (this.customer != null) this.WebSocketClientService.customer = this.customer as any;
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
        });
    }
    routeChangeStart(event: any, next: any, current: any) {
        this.path = this.$location.path();
    }
    hasrole(role: string) {
        if (NoderedUtil.IsNullUndefinded(WebSocketClient.instance)) return false;
        if (NoderedUtil.IsNullUndefinded(WebSocketClient.instance.user)) return false;
        if (role == "customer admins" && !NoderedUtil.IsNullUndefinded(WebSocketClient.instance.user.customerid)) {
            if (this.customer == null) return false;
            const hits = WebSocketClient.instance.user.roles.filter(member => member._id == this.customer.admins);
            if (hits.length == 1) return true;
        }
        const hits = WebSocketClient.instance.user.roles.filter(member => member.name == role);
        return (hits.length == 1)
    }
    showmanagecustomer() {
        if (NoderedUtil.IsNullUndefinded(WebSocketClient.instance)) return false;
        if (NoderedUtil.IsNullUndefinded(WebSocketClient.instance.user)) return false;
        if (!this.WebSocketClientService.multi_tenant) return false;
        if (this.customer == null || this.customers == null) return false;
        if (this.customers.length != 1) return false;
        const hits = WebSocketClient.instance.user.roles.filter(member => member._id == this.customer.admins);
        return (hits.length == 1)
    }
    hascordova() {
        return this.WebSocketClientService.usingCordova;
    }
    stopimpersonation() {
        // this.WebSocketClientService.loadToken();
        this.WebSocketClientService.impersonate("-1");
    }
    PathIs(path: string | string[]) {
        if (path == null && path == undefined) return false;
        if (this.path == null && this.path == undefined) return false;
        if (Array.isArray(path)) {
            for (var i = 0; i < path.length; i++) {
                if (path[i].endsWith("/") && this.path.toLowerCase().startsWith(path[i].toLowerCase()))
                    return true;
                else if (this.path.toLowerCase() == path[i].toLowerCase()) {
                    return true;
                }
            }
            return false;
        } else {
            if (path.endsWith("/") && this.path.toLowerCase().startsWith(path.toLowerCase()))
                return true;
            else if (this.path.toLowerCase() == path.toLowerCase()) {
                return true;
            }
            return false;
        }
    }
    toggleDarkMode() {
        this.halfmoon.toggleDarkMode();
    }
    toggleSidebar() {
        this.halfmoon.toggleSidebar();
    }
    Search() {
        this.$rootScope.$broadcast("search", this.searchstring);
    }
    async EditCustomer(customer) {
        try {
            if (customer == null) return;
            WebSocketClient.instance.user.selectedcustomerid = customer._id;
            this.WebSocketClientService.customer = customer as any;
            await NoderedUtil.SelectCustomer({ customerid: WebSocketClient.instance.user.selectedcustomerid });
            this.$location.path("/Customer/" + customer._id);
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
        } catch (error) {
            console.error(error);
        }
    }
    async SelectCustomer(customer) {
        try {
            this.customer = customer;
            if (customer != null) {
                WebSocketClient.instance.user.selectedcustomerid = customer._id;
                await NoderedUtil.SelectCustomer({ customerid: WebSocketClient.instance.user.selectedcustomerid });
                this.WebSocketClientService.customer = customer as any;
                if (this.PathIs("/Customer")) {
                    this.$location.path("/Customer/" + customer._id);
                    if (!this.$scope.$$phase) { this.$scope.$apply(); }
                }
            } else {
                WebSocketClient.instance.user.selectedcustomerid = null;
                await NoderedUtil.SelectCustomer({ customerid: WebSocketClient.instance.user.selectedcustomerid });
                this.WebSocketClientService.customer = null;
            }
            // this.$rootScope.$broadcast("menurefresh");
            this.$rootScope.$broadcast("search", this.searchstring);
        } catch (error) {
            console.error(error);
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }

    setCookie(cname, cvalue, exdays) {
        const d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        const expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }
    getCookie(cname) {
        const name = cname + "=";
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }
    public NewFeaturesTour: any;
    public Shepherd = require("shepherd.js");
    StartNewFeaturesTour(startfrom) {
        try {
            if (this.NewFeaturesTour != null) return;
            if (!this.WebSocketClientService.enable_web_tours) return;
            var me = this;
            this.NewFeaturesTour = new this.Shepherd.Tour({
                useModalOverlay: true,
                tourName: 'featuretour',
                exitOnEsc: true,
                defaultStepOptions: {
                    cancelIcon: {
                        enabled: true
                    },
                    scrollTo: { behavior: 'smooth', block: 'center' }
                },
            });
            let step: number = this.getCookie("newfeatures") as any;
            if (NoderedUtil.IsNullEmpty(step)) step = 0;
            if (!NoderedUtil.IsNullEmpty(startfrom)) {
                step = startfrom;
            }
            step = parseInt(step as any);

            this.NewFeaturesTour.on("show", (e) => {
                const currentstep = parseInt(e.step.id);
                if (currentstep < 0) {
                    step = step + 1;
                    this.setCookie("newfeatures", step, 365);
                } else {
                    step = currentstep;
                    this.setCookie("newfeatures", currentstep, 365);
                }
            });
            this.NewFeaturesTour.on("complete", (e) => {
                this.NewFeaturesTour = null;
            });
            this.NewFeaturesTour.on("cancel", (e) => {
                this.NewFeaturesTour = null;
            });
            const backbutton = {
                action() {
                    return this.back();
                },
                classes: 'shepherd-button-secondary',
                text: 'Back'
            };
            const nextbutton = {
                action() {
                    return this.next();
                },
                text: 'Next'
            };
            const completebutton = {
                action() {
                    return this.complete();
                },
                text: 'Complete'
            };
            this.NewFeaturesTour.addStep({
                title: 'New User Interface in OpenFlow',
                text: `The new UI in Openflow, allows for using darkmode, you can toogle darkmode on this button or you can use the keyboard shortcut Shift+D.`,
                attachTo: {
                    element: '#menudarkmode'
                },
                buttons: [nextbutton],
                id: '0'
            });

            if (this.WebSocketClientService.multi_tenant && this.customer != null && this.customers.length == 0) this.NewFeaturesTour.addStep({
                title: 'Enable multi tenancy',
                text: `Per default OpenFlow is running in a single user mode, where users cannot share information. Click here to create a new Customer, and enable access to multiple user, roles, control access to data and workflows and to buy additional services`,
                attachTo: {
                    element: '#menumultitenant'
                },
                buttons: [backbutton, nextbutton],
                id: '1'
            });
            if (this.hasrole("customer admins") || this.hasrole("resellers") || this.hasrole("admins")) {
                if (this.WebSocketClientService.multi_tenant && this.customer != null && this.customers.length == 1) this.NewFeaturesTour.addStep({
                    title: 'Manage your company',
                    text: `Click here to manage you company details, this is also where you can check your next Invoice and how many services you have added`,
                    attachTo: {
                        element: '#menumanagecustomer'
                    },
                    buttons: [backbutton, nextbutton],
                    id: '50'
                });
                if (this.WebSocketClientService.multi_tenant && this.customer != null && this.customers.length > 0) this.NewFeaturesTour.addStep({
                    title: 'Manage your users ',
                    text: `Click here to manage your users. You can create, edit and delete new users, and you can purchase and assign new services to users here`,
                    attachTo: {
                        element: '#menuadminusers'
                    },
                    when: {
                        show() {
                            me.OpenAdminsMenu();
                        },
                        hide() {
                            me.CloseAllMenus();
                        }
                    },
                    buttons: [backbutton, nextbutton],
                    id: '51'
                });

                if (this.WebSocketClientService.multi_tenant && this.customer != null && this.customers.length > 1) this.NewFeaturesTour.addStep({
                    title: 'Select a company',
                    text: `Click here to select a company to work with. This will filter the users and roles list, and control what customer to add new items too`,
                    attachTo: {
                        element: '#menuresellermenu'
                    },
                    buttons: [backbutton, nextbutton],
                    id: '52'
                });

            }
            if (this.NewFeaturesTour.steps.length > 0) {
                const laststepid = parseInt(this.NewFeaturesTour.steps[this.NewFeaturesTour.steps.length - 1].id);
                if (step <= laststepid) {
                    this.NewFeaturesTour.addStep({
                        title: 'Thank you for using OpenIAP',
                        text: `We hope you will enjoy the power of the leading open Source Integrated Automation Platform, click here to see different help tours.`,
                        attachTo: {
                            element: '#menutour'
                        },
                        buttons: [backbutton, completebutton],
                        id: '-1'
                    });
                    for (let i = 0; i < this.NewFeaturesTour.steps.length; i++) {
                        const _stepid = parseInt(this.NewFeaturesTour.steps[i].id);
                        if (_stepid < step) continue;
                        this.NewFeaturesTour.show(_stepid.toString())
                        return;
                    }
                }
            }
            this.NewFeaturesTour = null;
        } catch (error) {
            console.error(error);
        }
    }
    ListTours() {
        var me = this;
        try {
            const tour = new this.Shepherd.Tour({
                useModalOverlay: true,
                tourName: 'listoftour',
                exitOnEsc: true,
                defaultStepOptions: {
                    cancelIcon: {
                        enabled: true
                    },
                    scrollTo: { behavior: 'smooth', block: 'center' }
                },
            });
            let bottons: any[] = [];
            bottons.push({
                action() {
                    me.StartNewFeaturesTour(0);
                    return this.complete();
                },
                text: 'New Features'
            });
            if (this.WebSocketClientService.multi_tenant && this.customers.length > 0 && (this.hasrole("admins") ||
                this.hasrole("resellers") || this.hasrole("customer admins"))) {
                bottons.push({
                    action() {
                        me.StartManageCompanyTour();
                        return this.complete();
                    },
                    text: 'Manage Company'
                });
            }
            bottons.push({
                action() {
                    me.StartManageDataTour();
                    return this.complete();
                },
                text: 'Manage Data'
            });
            bottons.push({
                action() {
                    me.StartManageRobotsAndNoderedTour();
                    return this.complete();
                },
                text: 'Manage Robots and Nodered'
            });
            if (this.WebSocketClientService.stripe_api_key == "pk_live_0XOJdv1fPLPnOnRn40CSdBsh009Ge1B2yI") {
                tour.addStep({
                    title: 'What do you want to explorer ?',
                    text: `Select from one of the below guided tours to learn more. Use your keyboard arror keys to move back and forward and Esc to exit the tour. <br><small><i>For billing questions and sales support feel free to reach out on support@openiap.io, for all other questions use the <a class="text-primary" href="https://discourse.openiap.io" target="_blank" rel="noopener">forum</a> or <a class="text-primary" href="https://rocket.openiap.io/" target="_blank" rel="noopener">rocket</a> chat</i></small>`,
                    buttons: bottons,
                    id: 'tourlist'
                });
            } else {
                tour.addStep({
                    title: 'What do you want to explorer ?',
                    text: `Select from one of the below guided tours to learn more. Use your keyboard arror keys to move back and forward and Esc to exit the tour.`,
                    buttons: bottons,
                    id: 'tourlist'
                });
            }
            tour.start();
        } catch (error) {
            console.error(error);
        }
    }
    OpenAdminsMenu() {
        var me = this;
        this.allowclick = false;
        var target = document.getElementById("navbar-dropdown-toggle-btn-1");
        this.halfmoon.deactivateAllDropdownToggles();
        target.classList.add("active");
        target.closest(".dropdown").classList.add("show");
        setTimeout(() => {
            me.allowclick = true;
        }, 250);
    }
    CloseAllMenus() {
        this.halfmoon.deactivateAllDropdownToggles();
    }
    StartManageCompanyTour() {
        try {
            var me = this;
            const tour = new this.Shepherd.Tour({
                useModalOverlay: false,
                tourName: 'managecompanytour',
                exitOnEsc: true,
                defaultStepOptions: {
                    cancelIcon: {
                        enabled: true
                    },
                    scrollTo: { behavior: 'smooth', block: 'center' }
                },
            });
            let step: number = 0;
            tour.on("show", (e) => {
                const currentstep = parseInt(e.step.id);
                if (currentstep == 0 || currentstep == 2 || currentstep == 4) {
                    me.OpenAdminsMenu();
                }
                if (currentstep < 0) {
                    step = step + 1;
                } else {
                    step = currentstep;
                }
            });
            const backbutton = {
                action() {
                    return this.back();
                },
                classes: 'shepherd-button-secondary',
                text: 'Back'
            };
            const nextbutton = {
                action() {
                    return this.next();
                },
                text: 'Next'
            };
            const completebutton = {
                action() {
                    return this.complete();
                },
                text: 'Complete'
            };

            tour.addStep({
                title: 'User management',
                text: `You manage users by clicking Users in the admin menu`,
                beforeShowPromise: function () {
                    return new Promise((resolve) => setTimeout(resolve, 250));
                },
                when: {
                    show() {
                        me.$location.path("/Users");
                        if (!me.$scope.$$phase) { me.$scope.$apply(); }
                    }
                },
                attachTo: {
                    element: '#menuadminusers',
                    on: 'bottom'
                },
                popperOptions: {
                    modifiers: [{ name: 'offset', options: { offset: [0, 15] } }]
                },
                buttons: [nextbutton],
                id: '0'
            });

            tour.addStep({
                title: 'User management',
                text: `You assign new services to your users by clicking the <em class="fas fa-money-bill-wave"></em> icon. This require a valid vat number to have been added on the company page`,
                beforeShowPromise: function () {
                    return new Promise((resolve) => setTimeout(resolve, 250));
                },
                when: {
                    show() {
                    }
                },
                buttons: [backbutton, nextbutton],
                id: '1'
            });


            tour.addStep({
                title: 'Roles management',
                text: `You manage roles by clicking Roles in the admin menu. It is more efficent to use roles as a way to control access to resources and data. Many features will auto generate roles you can use to control access to these, like NodeRED workflows`,
                beforeShowPromise: function () {
                    return new Promise((resolve) => setTimeout(resolve, 250));
                },
                when: {
                    show() {
                    }
                },
                attachTo: {
                    element: '#menuadminroles',
                    on: 'bottom'
                },
                popperOptions: {
                    modifiers: [{ name: 'offset', options: { offset: [0, 15] } }]
                },
                buttons: [backbutton, nextbutton],
                id: '2'
            });

            tour.addStep({
                title: 'Roles management',
                text: `Roles is also how we load balance workload across multiple robots. Simply check RPA on the edit role page to allow assigning workflows to that role. Any robot that is only and not busy, will then pick up that workitem `,
                attachTo: {
                },
                buttons: [backbutton, nextbutton],
                id: '3'
            });
            tour.addStep({
                title: 'Audit logs',
                text: `This is the log of security events related to you and users you manage, this combined with the built in version control and on-the-fly encryption, makes it easy to comply with various regulatory demands like GDRP, FedRAMP, HIPAA etc. By default only your own entries are shown`,
                beforeShowPromise: function () {
                    return new Promise((resolve) => setTimeout(resolve, 250));
                },
                when: {
                    show() {
                        me.$location.path("/Auditlogs");
                        if (!me.$scope.$$phase) { me.$scope.$apply(); }
                    }
                },
                attachTo: {
                    element: '#menuadminauditlogs',
                    on: 'bottom'
                },
                popperOptions: {
                    modifiers: [{ name: 'offset', options: { offset: [0, 15] } }]
                },
                buttons: [backbutton, completebutton],
                id: '4'
            });

            // tour.addStep({
            //     title: 'Manage credentials',
            //     text: `For a more secure environment, it is a good practice to use encrypted credentials added here and not save those as plaintext in a robot workflow. Remember to give all robots access to the credentials.`,
            //     attachTo: {
            //         element: '#menuadmincredentials'
            //     },
            //     buttons: defaultbuttons,
            //     id: '3'
            // });
            // tour.addStep({
            //     title: 'Workflow forms',
            //     text: `Nodered Workflows allows you to design forms with an endless combination of different form elements to interact with users as part of a process`,
            //     attachTo: {
            //         element: '#menuadminforms'
            //     },
            //     buttons: defaultbuttons,
            //     id: '5'
            // });
            // tour.addStep({
            //     title: 'Files',
            //     text: `Files associated with robot workflows, forms and files you use as part of a Nodered workflow gets stored here. You can upload, download, delete and manage permissions on all files here. Remember to clean up, as a free user you only get 25 megabyte of storage`,
            //     attachTo: {
            //         element: '#menuadminfiles'
            //     },
            //     buttons: defaultbuttons,
            //     id: '6'
            // });

            // if (this.WebSocketClientService.multi_tenant && this.customer != null && this.customers.length > 1) tour.addStep({
            //     title: 'Enable multi tenancy',
            //     text: `Per default OpenFlow is running in a single user mode, where users cannot share information. Click here to create a new Customer, and enable access to multiple user, roles, control access to data and workflows and to buy additional services`,
            //     attachTo: {
            //         element: '#menumultitenant'
            //     },
            //     buttons: defaultbuttons,
            //     id: '7'
            // });
            // if (this.WebSocketClientService.multi_tenant && this.customer != null && this.customers.length < 2) tour.addStep({
            //     title: 'Manage you users ',
            //     text: `Click here to manage your users. You can create, edit and delete new users, and you can purchase and assign new services to users here`,
            //     attachTo: {
            //         element: '#menuadminusers'
            //     },
            //     buttons: defaultbuttons,
            //     id: '8'
            // });
            // if (this.WebSocketClientService.multi_tenant && this.customer != null && this.customers.length < 2) tour.addStep({
            //     title: 'Manage you roles',
            //     text: `Click here to manage your roles. It is much more efficent to use a role when assigning permissons`,
            //     attachTo: {
            //         element: '#menuadminroles'
            //     },
            //     buttons: defaultbuttons,
            //     id: '9'
            // });
            // if (this.WebSocketClientService.multi_tenant && this.customer != null && this.customers.length < 2) tour.addStep({
            //     title: 'Manage you company',
            //     text: `Click here to manage you company details, this is also where you can check your next Invoice and how many services you have added`,
            //     attachTo: {
            //         element: '#menumanagecustomer'
            //     },
            //     buttons: defaultbuttons,
            //     id: '10'
            // });

            // tour.addStep({
            //     title: 'Rerun tour',
            //     text: `We hope you will enjoy the power on the leading opensource automation platform, click here to restart all tour steps.`,
            //     attachTo: {
            //         element: '#menutour'
            //     },
            //     buttons: [
            //         {
            //             action() {
            //                 return this.back();
            //             },
            //             classes: 'shepherd-button-secondary',
            //             text: 'Back'
            //         },
            //         {
            //             action() {
            //                 return this.cancel();
            //             },
            //             text: 'Exit'
            //         }
            //     ],
            //     id: '-1'
            // });
            for (let i = 0; i < tour.steps.length; i++) {
                const _stepid = parseInt(tour.steps[i].id);
                if (_stepid < step) continue;
                tour.show(_stepid.toString())
                break;
            }
        } catch (error) {
            console.error(error);
        }
    }

    StartManageDataTour() {
        try {
            var me = this;
            const tour = new this.Shepherd.Tour({
                useModalOverlay: false,
                tourName: 'managedatatour',
                exitOnEsc: true,
                defaultStepOptions: {
                    cancelIcon: {
                        enabled: true
                    },
                    scrollTo: { behavior: 'smooth', block: 'center' }
                },
            });
            let step: number = 0;
            tour.on("show", (e) => {
                const currentstep = parseInt(e.step.id);
                // if (currentstep == 0 || currentstep == 2 || currentstep == 4) {
                //     me.OpenAdminsMenu();
                // }
                if (currentstep < 0) {
                    step = step + 1;
                } else {
                    step = currentstep;
                }
            });
            const backbutton = {
                action() {
                    return this.back();
                },
                classes: 'shepherd-button-secondary',
                text: 'Back'
            };
            const nextbutton = {
                action() {
                    return this.next();
                },
                text: 'Next'
            };

            tour.addStep({
                title: 'Managing Data',
                text: `OpenFlow is primarily a database with an security layer, and an api to orchestrate multiple NodeRED and OpenRPA robots. Data is there for a central element of understanding and getting the ful benefit of the platform`,
                buttons: [nextbutton],
                id: '0'
            });

            tour.addStep({
                title: 'Managing Data',
                text: `Most pages is a "view" on the data, but you can access ALL data inside the database, by clicking entities in the menu`,
                attachTo: {
                    element: '#menuentities',
                    on: 'bottom'
                },
                when: {
                    hide() {
                        delete me.userdata.data.EntitiesCtrl;
                        me.$location.path("/Entities/entities");
                        if (!me.$scope.$$phase) { me.$scope.$apply(); }
                    }
                },
                popperOptions: {
                    modifiers: [{ name: 'offset', options: { offset: [50, 10] } }]
                },
                buttons: [backbutton, nextbutton],
                id: '1'
            });

            tour.addStep({
                title: 'Managing Data',
                text: `The database contains a list of collections, similar to tables in an traditional relational database. We can store different kinds of data in the same collection, and there for group, and search our data in a more meaningful way`,
                beforeShowPromise: function () {
                    return new Promise((resolve) => setTimeout(resolve, 250));
                },
                attachTo: {
                    element: '#menucollections',
                    on: 'bottom'
                },
                when: {
                    hide() {
                        delete me.userdata.data.EntitiesCtrl;
                        me.$location.path("/Entities/users");
                        if (!me.$scope.$$phase) { me.$scope.$apply(); }
                    }
                },
                popperOptions: {
                    modifiers: [{ name: 'offset', options: { offset: [50, 20] } }]
                },

                buttons: [backbutton, nextbutton],
                id: '2'
            });


            tour.addStep({
                title: 'Managing Data',
                text: `I selected the "users" collection, and as you can see it contains both user and role objects.<br>
                Clicking <em class="fas fa-notes-medical"></em> will open the history for that object, allowing you to see different versions of the object<br>
                <em class="fas fa-edit"></em> to edit and set permissions, <em
                class="fas fa-trash"></em> to delete the entity`,
                buttons: [backbutton, nextbutton],
                id: '3'
            });


            tour.addStep({
                title: 'Managing Data',
                text: `Up here we have access to Undelete <em class="fas fa-undo"></em> to restore deleted object, <em class="fas fa-clone"></em> clone tool, that allows us to group all data by different keys and <em class="fas fa-plus"></em> to add a new entity to this collection`,
                attachTo: {
                    element: '#entitiestools',
                    on: 'bottom'
                },
                when: {
                    hide() {
                        me.$location.path("/Entity/entities");
                        delete me.userdata.data.EntitiesCtrl;
                        if (!me.$scope.$$phase) { me.$scope.$apply(); }
                    }
                },
                popperOptions: {
                    modifiers: [{ name: 'offset', options: { offset: [0, 20] } }]
                },

                buttons: [backbutton, nextbutton],
                id: '4'
            });



            tour.addStep({
                title: 'Managing Data',
                text: `When adding data, either from the webpage, a robot, NodeRED, PowerShell or the API, you need to comply with the entity restrictions setup for this OpenFlow instance, you will get an Access Denied if you do not have the right create permissions.`,
                popperOptions: {
                    modifiers: [{ name: 'offset', options: { offset: [50, 20] } }]
                },

                buttons: [backbutton, nextbutton],
                id: '5'
            });


            tour.addStep({
                title: 'Managing Data',
                text: `Every entity in the database has an Access Control List that defines who can read, edit, delete or invoke this entity. Invoke will have different meanings for different types of entities`,
                attachTo: {
                    element: '#entitypermissions',
                    on: 'bottom'
                },
                popperOptions: {
                    modifiers: [{ name: 'offset', options: { offset: [50, 40] } }]
                },
                buttons: [backbutton, nextbutton],
                id: '6'
            });

            tour.addStep({
                title: 'Managing Data',
                text: `Hear you can search for, and then add any user or role. You define what right you want to assign them. As a rule of thumb use roles, and not users unless absolutely necessary. Even with a low number of users it is often much more effecient to use roles to control permissions, than having to go back and update the permissions on all objects later to add/remove a user.`,
                attachTo: {
                    element: '#addusergroup',
                    on: 'bottom'
                },
                popperOptions: {
                    modifiers: [{ name: 'offset', options: { offset: [50, 20] } }]
                },
                buttons: [backbutton, nextbutton],
                id: '7'
            });
            tour.addStep({
                title: 'Managing Data',
                text: `By default you get an structured view that allows adding or removing properties, but you are free to click the "show json" button to edit the object directly`,
                attachTo: {
                    element: '#enableshowjson',
                    on: 'bottom'
                },
                popperOptions: {
                    modifiers: [{ name: 'offset', options: { offset: [50, 20] } }]
                },
                buttons: [backbutton, nextbutton],
                id: '8'
            });



            for (let i = 0; i < tour.steps.length; i++) {
                const _stepid = parseInt(tour.steps[i].id);
                if (_stepid < step) continue;
                tour.show(_stepid.toString())
                break;
            }
        } catch (error) {
            console.error(error);
        }
    }

    StartManageRobotsAndNoderedTour() {
        try {
            var me = this;

            const tour = new this.Shepherd.Tour({
                useModalOverlay: false,
                tourName: 'managerobotnoderedtour',
                exitOnEsc: true,
                defaultStepOptions: {
                    cancelIcon: {
                        enabled: true
                    },
                    scrollTo: { behavior: 'smooth', block: 'center' }
                },
            });
            let step: number = 0;
            tour.on("show", (e) => {
                const currentstep = parseInt(e.step.id);
                if (currentstep == 0 || currentstep == 1 || currentstep == 3 || currentstep == 6) {
                    me.OpenAdminsMenu();
                }
                if (currentstep < 0) {
                    step = step + 1;
                } else {
                    step = currentstep;
                }
            });
            const backbutton = {
                action() {
                    return this.back();
                },
                classes: 'shepherd-button-secondary',
                text: 'Back'
            };
            const nextbutton = {
                action() {
                    return this.next();
                },
                text: 'Next'
            };
            const completebutton = {
                action() {
                    return this.complete();
                },
                text: 'Complete'
            };

            tour.addStep({
                title: 'Managing Robots',
                text: `Robots run as a User. Normaly you will run a robot as your own user, but once you start to scale it makes sense to create dedicated bot accounts. 
                Keep in mind you cannot run multiply robots with the same user account, so create meaning full names when adding new users`,
                beforeShowPromise: function () {
                    return new Promise((resolve) => setTimeout(resolve, 250));
                },
                classes: 'shepherd shepherd-open shepherd-theme-arrows shepherd-transparent-text',

                when: {
                    show() {
                        me.$location.path("/Users");
                        if (!me.$scope.$$phase) { me.$scope.$apply(); }
                    }
                },
                attachTo: {
                    element: '#menuadminusers',
                    on: 'bottom'
                },
                popperOptions: {
                    modifiers: [{ name: 'offset', options: { offset: [0, 15] } }]
                },
                buttons: [nextbutton],
                id: '0'
            });

            tour.addStep({
                title: 'Managing Robots',
                text: `When scaling to many robots, you will need to spread out the workload to many robots. You can create a role, and add all the robot user accounts to that role.`,
                beforeShowPromise: function () {
                    return new Promise((resolve) => setTimeout(resolve, 250));
                },
                when: {
                    show() {
                        me.$location.path("/Roles");
                        if (!me.$scope.$$phase) { me.$scope.$apply(); }
                    },
                    hide() {
                        me.CloseAllMenus();
                        me.$location.path("/Role");
                        if (!me.$scope.$$phase) { me.$scope.$apply(); }
                    }
                },
                attachTo: {
                    element: '#menuadminroles',
                    on: 'bottom'
                },
                popperOptions: {
                    modifiers: [{ name: 'offset', options: { offset: [0, 15] } }]
                },
                buttons: [backbutton, nextbutton],
                id: '1'
            });


            tour.addStep({
                title: 'Managing Robots',
                text: `On the new role make sure to check the RPA role. This tell the robots that is member of this role, to wait for work sent to this role. When you send work to a role, any robot that is online and is not busy with other workflows will take the job. If no robots pick up the message it will be queue up and retry automatically`,
                beforeShowPromise: function () {
                    return new Promise((resolve) => setTimeout(resolve, 250));
                },
                when: {
                    show() {
                        me.$location.path("/Role");
                        if (!me.$scope.$$phase) { me.$scope.$apply(); }
                    }
                },
                attachTo: {
                    element: '#rparole',
                    on: 'right'
                },
                popperOptions: {
                    modifiers: [{ name: 'offset', options: { offset: [0, 120] } }]
                },
                buttons: [backbutton, nextbutton],
                id: '2'
            });


            tour.addStep({
                title: 'Credentials',
                text: `For a more secure environment, it is a good practice to use encrypted credentials added here and not save those as plaintext in a robot workflow. Remember to give all robots access to the credentials.`,
                beforeShowPromise: function () {
                    return new Promise((resolve) => setTimeout(resolve, 250));
                },
                when: {
                    show() {
                        me.$location.path("/Credentials");
                        if (!me.$scope.$$phase) { me.$scope.$apply(); }
                    },
                    hide() {
                        me.CloseAllMenus();
                    }
                },
                attachTo: {
                    element: '#menuadmincredentials',
                    on: 'bottom'
                },
                popperOptions: {
                    modifiers: [{ name: 'offset', options: { offset: [0, 15] } }]
                },
                buttons: [backbutton, nextbutton],
                id: '3'
            });


            tour.addStep({
                title: 'Clients',
                text: `On the clients page you can see all online users, and filter on the type of client used.`,
                beforeShowPromise: function () {
                    return new Promise((resolve) => setTimeout(resolve, 250));
                },
                when: {
                    show() {
                        me.$location.path("/Clients");
                        if (!me.$scope.$$phase) { me.$scope.$apply(); }
                    },
                    hide() {
                        me.CloseAllMenus();
                    }
                },
                attachTo: {
                    element: '#menuclients',
                    on: 'bottom'
                },
                popperOptions: {
                    modifiers: [{ name: 'offset', options: { offset: [0, 15] } }]
                },
                buttons: [backbutton, nextbutton],
                id: '3'
            });


            tour.addStep({
                title: 'RPA Workflows',
                text: `On the rpa workflows page, you can see a list of all the RPA workflows you have access too, if you click invoke <em
                class="fas fa-play-circle"></em>, you can even start them from this webpage, given the robot is online`,
                beforeShowPromise: function () {
                    return new Promise((resolve) => setTimeout(resolve, 250));
                },
                when: {
                    show() {
                        me.$location.path("/RPAWorkflows");
                        if (!me.$scope.$$phase) { me.$scope.$apply(); }
                    },
                    hide() {
                        me.CloseAllMenus();
                    }
                },
                attachTo: {
                    element: '#menurpaworkflows',
                    on: 'bottom'
                },
                popperOptions: {
                    modifiers: [{ name: 'offset', options: { offset: [0, 15] } }]
                },
                buttons: [backbutton, nextbutton],
                id: '4'
            });


            var nodered_multi_tenant_turns_off = "";
            if (this.WebSocketClientService.multi_tenant) {
                nodered_multi_tenant_turns_off = "The free version will stop after a few hours hours and have limited amount of ram. ";
            }
            tour.addStep({
                title: 'Nodered',
                text: `On the NodeRED page, you can start your personal NodeRED instance. ` + nodered_multi_tenant_turns_off + `This is where you can schedule robots, and install modules that allows easy integration to more than 3500 IT systems. This is also where you create workflow, that can involve humans using different channels like email, chat, voice or the forms you design in OpenFlow`,
                beforeShowPromise: function () {
                    return new Promise((resolve) => setTimeout(resolve, 250));
                },
                when: {
                    show() {
                        me.$location.path("/Nodered");
                        if (!me.$scope.$$phase) { me.$scope.$apply(); }
                    },
                    hide() {
                        me.CloseAllMenus();
                    }
                },
                attachTo: {
                    element: '#menunodered',
                    on: 'bottom'
                },
                popperOptions: {
                    modifiers: [{ name: 'offset', options: { offset: [0, 15] } }]
                },
                buttons: [backbutton, nextbutton],
                id: '5'
            });


            tour.addStep({
                title: 'Forms',
                text: `This is where you can create forms, used by workflows in NodeRED. You can combine this with other channels as well, and then automated based on the input you get and/or present the results`,
                beforeShowPromise: function () {
                    return new Promise((resolve) => setTimeout(resolve, 250));
                },
                when: {
                    show() {
                        me.$location.path("/Forms");
                        if (!me.$scope.$$phase) { me.$scope.$apply(); }
                    },
                    hide() {
                        me.CloseAllMenus();
                    }
                },
                attachTo: {
                    element: '#menuadminforms',
                    on: 'bottom'
                },
                popperOptions: {
                    modifiers: [{ name: 'offset', options: { offset: [0, 15] } }]
                },
                buttons: [backbutton, nextbutton],
                id: '6'
            });


            tour.addStep({
                title: 'Workflows',
                text: `Once you created a Workflow in NodeRED, this is where you and your users can start the workflow. Each workflow will have a corrosponding role created, that you need to add the users too, in order to see and invoke the workflow. You can "chain" many workflows, so triggering one workflow will create one or more sub workflows and wait for the results. This is handy when working with complex swim lanes or process that span multiple departments.`,
                beforeShowPromise: function () {
                    return new Promise((resolve) => setTimeout(resolve, 250));
                },
                when: {
                    show() {
                        me.$location.path("/Workflows");
                        if (!me.$scope.$$phase) { me.$scope.$apply(); }
                    },
                    hide() {
                        me.CloseAllMenus();
                    }
                },
                attachTo: {
                    element: '#menuworkflows',
                    on: 'bottom'
                },
                popperOptions: {
                    modifiers: [{ name: 'offset', options: { offset: [0, 15] } }]
                },
                buttons: [backbutton, nextbutton],
                id: '7'
            });
            // tour.addStep({
            //     title: 'Files',
            //     text: `Files associated with robot workflows, forms and files you use as part of a Nodered workflow gets stored here. You can upload, download, delete and manage permissions on all files here. Remember to clean up, as a free user you only get 25 megabyte of storage`,
            //     attachTo: {
            //         element: '#menuadminfiles'
            //     },
            //     buttons: defaultbuttons,
            //     id: '6'
            // });
            for (let i = 0; i < tour.steps.length; i++) {
                const _stepid = parseInt(tour.steps[i].id);
                if (_stepid < step) continue;
                tour.show(_stepid.toString())
                break;
            }
        } catch (error) {
            console.error(error);
        }
    }
}
export class RPAWorkflowCtrl extends entityCtrl<RPAWorkflow> {
    public arguments: any;
    public users: TokenUser[];
    public user: TokenUser;
    public messages: string;
    public queuename: string = "";
    public timeout: string = (60 * 1000).toString(); // 1 min;
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $sce: ng.ISCEService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $sce, $interval, WebSocketClientService, api, userdata);
        console.debug("RPAWorkflowCtrl");
        this.collection = "openrpa";
        this.messages = "";
        WebSocketClientService.onSignedin(async (_user: TokenUser) => {
            await this.RegisterQueue();
            this.$scope.$on('signin', (event, data) => {
                this.RegisterQueue();
            });
            if (this.id !== null && this.id !== undefined) {
                await this.loadData();
                await this.loadUsers();
            } else {
                console.error("Missing id");
            }
        });
    }
    async RegisterQueue() {
        try {
            this.queuename = await NoderedUtil.RegisterQueue({
                callback: (data: QueueMessage, ack: any) => {
                    ack();
                    if (data.data.command == undefined && data.data.data != null) data.data = data.data.data;
                    this.messages += data.data.command + "\n";
                    if (data.data.command == "invokecompleted") {
                        this.arguments = data.data.data;
                    }
                    if (data.data.command == "invokefailed") {
                        if (data.data && data.data.data && data.data.data.Message) {
                            this.errormessage = data.data.data.Message;
                        } else {
                            this.errormessage = JSON.stringify(data.data);
                        }

                    }
                    if (!this.$scope.$$phase) { this.$scope.$apply(); }
                }, closedcallback: (msg) => {
                    this.queuename = "";
                    console.debug("rabbitmq disconnected, start reconnect")
                    setTimeout(this.RegisterQueue.bind(this), (Math.floor(Math.random() * 6) + 1) * 500);
                }
            });
        } catch (error) {
            this.queuename = "";
            console.debug("register queue failed, start reconnect. " + error.message ? error.message : error)
            setTimeout(this.RegisterQueue.bind(this), (Math.floor(Math.random() * 6) + 1) * 500);
        }
    }
    async loadUsers(): Promise<void> {
        this.users = await NoderedUtil.Query({ collectionname: "users", query: { $or: [{ _type: "user" }, { _type: "role", rparole: true }] } });
        this.users.forEach(user => {
            if (user._id == this.model._createdbyid || user._id == this.model._modifiedbyid) {
                this.user = user;
            }
        });
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    public parseBoolean(s: any): boolean {
        let val: string;
        if (typeof s === "number") {
            val = s.toString();
        } else if (typeof s === "string") {
            val = s.toLowerCase().trim();
        } else if (typeof s === "boolean") {
            val = s.toString();
        } else {
            throw new Error("Unknown type!");
        }
        switch (val) {
            case "true": case "yes": case "1": return true;
            case "false": case "no": case "0": case null: return false;
            default: return Boolean(s);
        }
    }
    async submit(): Promise<void> {
        try {
            this.errormessage = "";
            if (this.arguments === null || this.arguments === undefined) { this.arguments = {}; }

            var keys = Object.keys(this.arguments);
            for(let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const param = this.model.Parameters.find(x=> x.name == key);
                if(param && param.type == "System.String") this.arguments[key] = this.arguments[key] ?? "";
                if(param && param.type == "System.Int32") this.arguments[key] = parseInt(this.arguments[key]);
                if(param && param.type == "System.Boolean") this.arguments[key] = this.parseBoolean(this.arguments[key]);
                if(param && param.type == "System.DateTime") {
                    if(this.arguments[key] != null && this.arguments[key] != "") {
                        this.arguments[key] = new Date(this.arguments[key]).toISOString();
                    } else {
                        this.arguments[key] = undefined;
                    }
                }
                if(param && param.type == "System.String[]" && Array.isArray(this.arguments[key]) == false ) {
                    var arr = this.arguments[key].split(",");
                    this.arguments[key] = arr;
                }
                if(param && param.type == "System.Int32[]" && Array.isArray(this.arguments[key]) == false ) {
                    var arr = this.arguments[key].split(",");
                    arr = arr.map(x=> parseInt(x));
                    this.arguments[key] = arr;
                }
                if(param && param.type == "System.Boolean[]" && Array.isArray(this.arguments[key]) == false ) {
                    var arr = this.arguments[key].split(",");
                    arr = arr.map(x=> this.parseBoolean(x));
                    this.arguments[key] = arr;
                }
                if(param && param.type == "System.DateTime[]" && Array.isArray(this.arguments[key]) == false ) {
                    var arr = this.arguments[key].split(",");
                    arr = arr.map(x=> new Date(x).toISOString());
                    this.arguments[key] = arr;
                }
                console.log(key, this.arguments[key])
            }

            const rpacommand = {
                command: "invoke",
                workflowid: this.model._id,
                data: {...this.arguments}
            }
            for(let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const param = this.model.Parameters.find(x=> x.name == key);
                // console.log(key, this.arguments[key])
                if(param && param.type == "System.String[]" && Array.isArray(this.arguments[key]) == true ) {
                    this.arguments[key] = this.arguments[key].join(",");
                }
                if(param && param.type == "System.Int32[]" && Array.isArray(this.arguments[key]) == true ) {
                    this.arguments[key] = this.arguments[key].join(",");
                }
                if(param && param.type == "System.Boolean[]" && Array.isArray(this.arguments[key]) == true ) {
                    this.arguments[key] = this.arguments[key].join(",");
                }
                if(param && param.type == "System.DateTime[]" && Array.isArray(this.arguments[key]) == true ) {
                    this.arguments[key] = this.arguments[key].join(",");
                }
                console.log(key, this.arguments[key])
            }
            const result: any = await NoderedUtil.Queue({ queuename: this.user._id, replyto: this.queuename, data: rpacommand, expiration: parseInt(this.timeout), striptoken: true });
            try {
                // result = JSON.parse(result);
            } catch (error) {
            }
        } catch (error) {
            console.error(error);
            this.errormessage = error.message ? error.message : error;
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
}
export class RPAWorkflowsCtrl extends entitiesCtrl<Base> {
    public message: string = "";
    public charts: chartset[] = [];
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $interval, WebSocketClientService, api, userdata);
        console.debug("RPAWorkflowsCtrl");
        this.collection = "openrpa";
        this.basequery = { _type: "workflow" };
        this.baseprojection = { _type: 1, type: 1, name: 1, _created: 1, _createdby: 1, _modified: 1, projectandname: 1 };
        this.postloadData = this.processdata;
        if (this.userdata.data != null && this.userdata.data.basequeryas != null) {
            this.basequeryas = this.userdata.data.basequeryas;
        } else if (this.userdata.data.RPAWorkflowsCtrl) {
            if (this.userdata.data.RPAWorkflowsCtrl.basequeryas) this.basequeryas = this.userdata.data.RPAWorkflowsCtrl.basequeryas;
            if (this.userdata.data.RPAWorkflowsCtrl.basequery) {
                this.basequery = this.userdata.data.RPAWorkflowsCtrl.basequery;
                this.collection = this.userdata.data.RPAWorkflowsCtrl.collection;
                this.baseprojection = this.userdata.data.RPAWorkflowsCtrl.baseprojection;
                this.orderby = this.userdata.data.RPAWorkflowsCtrl.orderby;
                this.searchstring = this.userdata.data.RPAWorkflowsCtrl.searchstring;
                this.basequeryas = this.userdata.data.RPAWorkflowsCtrl.basequeryas;
            }
        }
        WebSocketClientService.onSignedin((user: TokenUser) => {
            this.loadData();
        });
    }
    processdata() {
        this.loading = true;
        this.loading = false;
        if (!this.userdata.data.RPAWorkflowsCtrl) this.userdata.data.RPAWorkflowsCtrl = {};
        this.userdata.data.RPAWorkflowsCtrl.basequery = this.basequery;
        this.userdata.data.RPAWorkflowsCtrl.collection = this.collection;
        this.userdata.data.RPAWorkflowsCtrl.baseprojection = this.baseprojection;
        this.userdata.data.RPAWorkflowsCtrl.orderby = this.orderby;
        this.userdata.data.RPAWorkflowsCtrl.searchstring = this.searchstring;
        this.userdata.data.RPAWorkflowsCtrl.basequeryas = this.basequeryas;
        const chart: chartset = null;
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
        this.dographs();
    }
    async dographs() {
        const datatimeframe = new Date(new Date().toISOString());
        datatimeframe.setDate(datatimeframe.getDate() - 5);
        const aggregates: any = [
            { $match: { _created: { "$gte": datatimeframe } } },
            {
                $group:
                {
                    _id:
                    {
                        WorkflowId: "$WorkflowId",
                        name: "$name",
                        day: { $dayOfMonth: "$_created" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.day": 1 } }
            // ,{ "$limit": 20 }
        ];
        const workflowruns = await NoderedUtil.Aggregate({ collectionname: "openrpa_instances", aggregates });


        for (let i = 0; i < this.models.length; i++) {
            const workflow = this.models[i] as any;

            const chart: chartset = new chartset();
            chart.data = [];
            for (let x = 0; x < workflowruns.length; x++) {
                if (workflowruns[x]._id.WorkflowId == workflow._id) {
                    chart.data.push(workflowruns[x].count);
                    chart.labels.push(workflowruns[x]._id.day);
                }
            }
            if (chart.data.length > 0) {
                workflow.chart = chart;
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
            }
        }
    }
    download(data, filename, type) {
        const file = new Blob([data], { type: type });
        if ((window.navigator as any).msSaveOrOpenBlob) // IE10+
            (window.navigator as any).msSaveOrOpenBlob(file, filename);
        else { // Others
            const a = document.createElement("a"),
                url = URL.createObjectURL(file);
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(function () {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
        }
    }
    async Download(model: any) {
        const workflows = await NoderedUtil.Query({ collectionname: "openrpa", query: { _type: "workflow", _id: model._id }, top: 1 });
        if (workflows.length > 0) {
            model = workflows[0];
            if (NoderedUtil.IsNullEmpty(model.Xaml)) model.Xaml = "";
            this.download(model.Xaml, model.name + ".xaml", "application/xaml+xml");
        }
    }

}
export class WorkflowsCtrl extends entitiesCtrl<Base> {
    public message: string = "";
    public charts: chartset[] = [];
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $interval, WebSocketClientService, api, userdata);
        this.collection = "workflow";
        this.basequery = { _type: "workflow", web: true };
        console.debug("WorkflowsCtrl");
        this.postloadData = this.processData;
        if (this.userdata.data.WorkflowsCtrl) {
            this.basequery = this.userdata.data.WorkflowsCtrl.basequery;
            this.collection = this.userdata.data.WorkflowsCtrl.collection;
            this.baseprojection = this.userdata.data.WorkflowsCtrl.baseprojection;
            this.orderby = this.userdata.data.WorkflowsCtrl.orderby;
            this.searchstring = this.userdata.data.WorkflowsCtrl.searchstring;
            this.basequeryas = this.userdata.data.WorkflowsCtrl.basequeryas;
        }
        WebSocketClientService.onSignedin((user: TokenUser) => {
            this.loadData();
        });
    }
    async processData(): Promise<void> {
        if (!this.userdata.data.WorkflowsCtrl) this.userdata.data.WorkflowsCtrl = {};
        this.userdata.data.WorkflowsCtrl.basequery = this.basequery;
        this.userdata.data.WorkflowsCtrl.collection = this.collection;
        this.userdata.data.WorkflowsCtrl.baseprojection = this.baseprojection;
        this.userdata.data.WorkflowsCtrl.orderby = this.orderby;
        this.userdata.data.WorkflowsCtrl.searchstring = this.searchstring;
        this.userdata.data.WorkflowsCtrl.basequeryas = this.basequeryas;
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
}
export class chartset {
    options: any = {
        legend: { display: true }
    };
    // baseColors: string[] = ['#F7464A', '#97BBCD', '#FDB45C', '#46BFBD', '#949FB1', '#4D5360'];
    // baseColors: string[] = ['#803690', '#00ADF9', '#DCDCDC', '#46BFBD', '#FDB45C', '#949FB1', '#4D5360'];
    baseColors: [
        '#97BBCD', // blue
        '#DCDCDC', // light grey
        '#F7464A', // red
        '#46BFBD', // green
        '#FDB45C', // yellow
        '#949FB1', // grey
        '#4D5360'  // dark grey
    ];
    colors: string[] = [
        '#97BBCD', // blue
        '#DCDCDC', // light grey
        '#F7464A', // red
        '#46BFBD', // green
        '#FDB45C', // yellow
        '#949FB1', // grey
        '#4D5360'  // dark grey
    ];
    type: string = 'bar';
    heading: string = "";
    labels: string[] = [];
    series: string[] = [];
    data: any[] = [];
    ids: any[] = [];
    charttype: string = "bar";
    click: any = null;
}
export declare function emit(k, v);
export class ReportsCtrl extends entitiesCtrl<Base> {
    public message: string = "";
    public charts: chartset[] = [];
    public datatimeframe: Date;
    public onlinetimeframe: Date;
    public timeframedesc: string = "";
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $interval, WebSocketClientService, api, userdata);
        console.debug("ReportsCtrl");
        WebSocketClientService.onSignedin((user: TokenUser) => {
            if (this.userdata.data.ReportsCtrl) {
                this.datatimeframe = this.userdata.data.ReportsCtrl.datatimeframe;
                this.onlinetimeframe = this.userdata.data.ReportsCtrl.onlinetimeframe;
                this.processData();
            } else {
                this.settimeframe(30, 0, "30 days");
            }

        });
    }
    settimeframe(days, hours, desc) {
        this.datatimeframe = new Date(new Date().toISOString());
        if (days > 0) this.datatimeframe.setDate(this.datatimeframe.getDate() - days);
        if (hours > 0) this.datatimeframe.setHours(this.datatimeframe.getHours() - hours);
        this.timeframedesc = desc;

        this.onlinetimeframe = new Date(new Date().toISOString());
        this.onlinetimeframe.setMinutes(this.onlinetimeframe.getMinutes() - 1);
        // this.datatimeframe = new Date(new Date().toISOString());
        // this.datatimeframe.setMonth(this.datatimeframe.getMonth() - 1);

        // dt = new Date(new Date().toISOString());
        // dt.setMonth(dt.getMonth() - 1);
        // //dt.setDate(dt.getDate() - 1);
        // dt = new Date(new Date().toISOString());
        // dt.setMonth(dt.getMonth() - 1);
        // const dt2 = new Date(new Date().toISOString());
        // dt2.setMinutes(dt.getMinutes() - 1);

        if (!this.userdata.data.ReportsCtrl) this.userdata.data.ReportsCtrl = { run: this.processData.bind(this) };
        this.userdata.data.ReportsCtrl.datatimeframe = this.datatimeframe;
        this.userdata.data.ReportsCtrl.onlinetimeframe = this.onlinetimeframe;
        this.userdata.data.ReportsCtrl.run(this.userdata.data.ReportsCtrl.points);
    }
    async processData(): Promise<void> {
        this.userdata.data.ReportsCtrl.run = this.processData.bind(this);
        this.userdata.data.ReportsCtrl.points = null;
        this.loading = true;
        this.charts = [];
        let aggregates: any = [
            { $match: { _rpaheartbeat: { "$gte": this.datatimeframe } } },
            { "$count": "_rpaheartbeat" }
        ];
        let data: any[] = await NoderedUtil.Aggregate({ collectionname: "users", aggregates });
        let totalrobots = 0;
        if (data.length > 0) totalrobots = data[0]._rpaheartbeat;

        aggregates = [
            { $match: { _rpaheartbeat: { "$gte": this.onlinetimeframe } } },
            { "$count": "_rpaheartbeat" }
        ];
        data = await NoderedUtil.Aggregate({ collectionname: "users", aggregates });
        let onlinerobots = 0;
        if (data.length > 0) onlinerobots = data[0]._rpaheartbeat;

        const chart: chartset = new chartset();
        chart.heading = onlinerobots + " Online and " + (totalrobots - onlinerobots) + " offline robots, seen the last " + this.timeframedesc;
        chart.labels = ['online', 'offline'];
        chart.data = [onlinerobots, (totalrobots - onlinerobots)];
        chart.charttype = "pie";
        chart.colors = [
            // '#98FB98', // very light green
            // '#F08080', // very light red
            // '#228B22', // green
            // '#B22222', // red
            '#006400', // green
            '#8B0000', // red
        ];

        // chart.click = this.robotsclick.bind(this);
        chart.click = this.robotsclick.bind(this);
        this.charts.push(chart);
        if (!this.$scope.$$phase) { this.$scope.$apply(); }


        // const agg = [{ "$group": { "_id": "$_type", "count": { "$sum": 1 } } }];

        aggregates = [
            { $match: { _created: { "$gte": this.datatimeframe }, _type: "workflowinstance" } },
            { "$group": { "_id": { "WorkflowId": "$WorkflowId", "name": "$name" }, "count": { "$sum": 1 } } },
            { $sort: { "count": -1 } },
            { "$limit": 20 }
        ];
        const workflowruns = await NoderedUtil.Aggregate({ collectionname: "openrpa_instances", aggregates });

        const chart2: chartset = new chartset();
        chart2.heading = "Workflow runs (top 20)";
        chart2.data = [];
        chart2.ids = [];
        for (let x = 0; x < workflowruns.length; x++) {
            // chart2.data[0].push(workflowruns[x]._id.name);
            // chart2.data[1].push(workflowruns[x].count);
            chart2.data.push(workflowruns[x].count);
            chart2.ids.push(workflowruns[x]._id.WorkflowId);
            chart2.labels.push(workflowruns[x]._id.name);
        }
        chart2.click = this.workflowclick.bind(this);
        this.charts.push(chart2);

        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    async robotsclick(points, evt): Promise<void> {
        this.userdata.data.ReportsCtrl.run = this.robotsclick.bind(this);
        this.userdata.data.ReportsCtrl.points = points;
        if (points.length > 0) {
        } else { return; }
        let chart: chartset = null;
        let aggregates: any = {};
        let rpaheartbeat: any = [];
        if (points[0]._index == 0) // Online robots
        {
            // rpaheartbeat = { $match: { "user._rpaheartbeat": { "$gte": this.onlinetimeframe } } };
            rpaheartbeat = { $match: { "_rpaheartbeat": { "$gte": this.onlinetimeframe } } };
        } else {

            // rpaheartbeat = { $match: { "user._rpaheartbeat": { "$lt": this.onlinetimeframe } } };
            rpaheartbeat = { $match: { "_rpaheartbeat": { "$lt": this.onlinetimeframe } } };
        }
        this.charts = [];
        aggregates = [
            { $match: { _type: 'user' } }
            , { $sort: { "_rpaheartbeat": -1 } }
            , { "$limit": 20 }
            , rpaheartbeat
            , {
                $lookup: {
                    from: "audit",
                    localField: "_id",
                    foreignField: "userid",
                    as: "audit"
                }
            }
            , {
                $project: {
                    "_id": 1,
                    "name": 1,
                    "count": { "$size": "$audit" }
                }
            }
            , { $sort: { "count": -1 } }
            // , { $sort: { "_rpaheartbeat": -1 } }
            // , { "$limit": 20 }
        ];
        let data = await NoderedUtil.Aggregate({ collectionname: "users", aggregates });

        chart = new chartset();
        if (points[0]._index == 0) // Online robots
        {
            chart.heading = "Logins per online robot the last " + this.timeframedesc + " (top 20)";
        } else {
            chart.heading = "Logins per offline robot the last " + this.timeframedesc + " (top 20)";
        }
        chart.data = [];
        chart.ids = [];
        for (let x = 0; x < data.length; x++) {
            chart.data.push(data[x].count);
            chart.ids.push(data[x]._id);
            chart.labels.push(data[x].name);
        }
        chart.click = this.robotclick.bind(this);
        this.charts.push(chart);
        if (!this.$scope.$$phase) { this.$scope.$apply(); }


        if (points[0]._index == 0) // Online robots
        {
            rpaheartbeat = { $match: { "user._rpaheartbeat": { "$gte": this.onlinetimeframe } } };
        } else {
            rpaheartbeat = { $match: { "user._rpaheartbeat": { "$lt": this.onlinetimeframe } } };
        }

        aggregates = [
            { $match: { _created: { "$gte": this.datatimeframe }, _type: "workflowinstance" } },
            {
                $lookup: {
                    from: "users",
                    localField: "ownerid",
                    foreignField: "_id",
                    as: "userarr"
                }
            },
            {
                "$project": {
                    "WorkflowId": 1,
                    "name": 1,
                    "user": { "$arrayElemAt": ["$userarr", 0] }
                }
            },
            {
                "$project": {
                    "WorkflowId": 1,
                    "newname": { $concat: ["$name", " (", "$user.name", ")"] },
                    "name": 1,
                    "user": 1
                }
            },
            rpaheartbeat,
            // { $project: { "newname":  } },


            { "$group": { "_id": { "WorkflowId": "$WorkflowId", "name": "$newname" }, "count": { "$sum": 1 } } },
            { $sort: { "count": -1 } },
            { "$limit": 20 }
        ];
        const workflowruns = await NoderedUtil.Aggregate({ collectionname: "openrpa_instances", aggregates });

        chart = new chartset();
        if (points[0]._index == 0) // Online robots
        {
            chart.heading = "Workflow runs for online robots (top 20)";
        } else {
            chart.heading = "Workflow runs for offline robots (top 20)";
        }
        chart.data = [];
        chart.ids = [];
        for (let x = 0; x < workflowruns.length; x++) {
            chart.data.push(workflowruns[x].count);
            chart.ids.push(workflowruns[x]._id.WorkflowId);
            chart.labels.push(workflowruns[x]._id.name);
        }
        chart.click = this.workflowclick.bind(this);
        this.charts.push(chart);


        if (!this.$scope.$$phase) { this.$scope.$apply(); }

    }
    async robotclick(points, evt): Promise<void> {
        if (points.length > 0) {
        } else { return; }
        const userid = this.charts[0].ids[points[0]._index];
        let chart: chartset = null;
        let aggregates: any = {};
        aggregates = [
            { $match: { _created: { "$gte": this.datatimeframe }, _type: "workflowinstance", ownerid: userid } },
            { "$group": { "_id": { "WorkflowId": "$WorkflowId", "name": "$name", "owner": "$owner" }, "count": { "$sum": 1 } } },
            { $sort: { "count": -1 } },
            { "$limit": 20 }
        ];
        const workflowruns = await NoderedUtil.Aggregate({ collectionname: "openrpa_instances", aggregates });

        chart = new chartset();
        if (workflowruns.length > 0) // Online robots
        {
            chart.heading = "Workflow runs for " + workflowruns[0].owner + " (top 20)";
        } else {
            chart.heading = "No data (or permissions) for robot";
        }
        chart.data = [];
        chart.ids = [];
        for (let x = 0; x < workflowruns.length; x++) {
            chart.data.push(workflowruns[x].count);
            chart.ids.push(workflowruns[x]._id.WorkflowId);
            chart.labels.push(workflowruns[x]._id.name);
        }
        chart.click = this.workflowclick.bind(this);
        this.charts.splice(1, 1);
        this.charts.push(chart);


        if (!this.$scope.$$phase) { this.$scope.$apply(); }

    }
    async workflowclick(points, evt): Promise<void> {
        if (points.length > 0) {
        } else { return; }

        const WorkflowId = this.charts[1].ids[points[0]._index];

        let chart: chartset = null;
        let aggregates: any = {};
        aggregates = [
            { $match: { _created: { "$gte": this.datatimeframe }, WorkflowId: WorkflowId } },
            {
                $group:
                {
                    _id:
                    {
                        name: "$name",
                        day: { $dayOfMonth: "$_created" },
                        month: { $month: "$_created" },
                        year: { $year: "$_created" }
                    },
                    total: { $sum: "$data" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.day": 1 } },
            { "$limit": 20 }
        ];
        const workflowruns = await NoderedUtil.Aggregate({ collectionname: "openrpa_instances", aggregates });

        chart = new chartset();
        if (workflowruns.length > 0) {
            chart.heading = "Number of runs per day for " + workflowruns[0]._id.name;
        } else {
            chart.heading = "No data ";
        }
        chart.data = [];
        for (let x = 0; x < workflowruns.length; x++) {
            chart.data.push(workflowruns[x].count);
            chart.labels.push(workflowruns[x]._id.day);
        }
        chart.click = this.processData.bind(this);
        this.charts.splice(1, 1);
        this.charts.push(chart);


        if (!this.$scope.$$phase) { this.$scope.$apply(); }

    }
    async InsertNew(): Promise<void> {
        // this.loading = true;
        const item = { name: "Find me " + NoderedUtil.GetUniqueIdentifier(), "temp": "hi mom" };
        const result = await NoderedUtil.InsertOne({ collectionname: this.collection, item });
        this.models.push(result);
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    async UpdateOne(item: any): Promise<any> {
        const index = this.models.indexOf(item);
        this.loading = true;
        item.name = "Find me " + NoderedUtil.GetUniqueIdentifier();
        const newmodel = await NoderedUtil.UpdateOne({ collectionname: this.collection, item });
        this.models = this.models.filter(function (m: any): boolean { return m._id !== item._id; });
        this.models.splice(index, 0, newmodel);
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
}
export class MainCtrl extends entitiesCtrl<Base> {
    public showcompleted: boolean = false;
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $interval, WebSocketClientService, api, userdata);
        console.debug("MainCtrl");
        this.collection = "workflow_instances"
        this.skipcustomerfilter = true;
        // this.basequery = { state: { $ne: "completed" }, $and: [{ form: { $exists: true } }, { form: { "$ne": "none" } }] };
        // this.basequery = { state: { $ne: "completed" }, form: { $exists: true } };
        this.preloadData = () => {
            const user = WebSocketClient.instance.user;
            const ors: any[] = [];
            ors.push({ targetid: user._id });
            WebSocketClient.instance.user.roles.forEach(role => {
                ors.push({ targetid: role._id });
            });
            this.basequery = {};
            this.basequery = { $or: ors };
            if (!this.showcompleted) {
                // this.basequery.state = { $ne: "completed" };
                this.basequery["$and"] = [{ state: { $ne: "completed" } }, { state: { $ne: "failed" } }];
                this.basequery.form = { $exists: true };
                // this.basequery.$or = ors;
            } else {
            }
        };
        WebSocketClientService.onSignedin((_user: TokenUser) => {
            this.loadData();
        });

    }
}
declare const QRScanner: any;
export class LoginCtrl {
    public localenabled: boolean = false;
    public scanning: boolean = false;
    public qrcodescan: boolean = false;
    public providers: any = false;
    public username: string = "";
    public password: string = "";
    public message: string = "";
    public domain: string = "";
    public allow_user_registration: boolean = false;
    public forgot_pass_emails: boolean = false;
    public static $inject = [
        "$scope",
        "$location",
        "$routeParams",
        "WebSocketClientService",
        "api"
    ];
    constructor(
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public WebSocketClientService: WebSocketClientService,
        public api: api
    ) {
        console.debug("LoginCtrl::constructor");
        this.domain = window.location.hostname;
        WebSocketClientService.getJSON("/loginproviders", async (error: any, data: any) => {
            if (NoderedUtil.IsNullUndefinded(data)) return;
            this.forgot_pass_emails = WebSocketClientService.forgot_pass_emails;
            this.providers = data;
            this.allow_user_registration = WebSocketClientService.allow_user_registration;
            for (let i: number = this.providers.length - 1; i >= 0; i--) {
                if (this.providers[i].provider == "local") {
                    this.providers.splice(i, 1);
                    this.localenabled = true;
                }
            }
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
            setTimeout(this.scanForQRScanner.bind(this), 200);
        });
    }
    readfile(filename: string) {
        return new Promise<string>(async (resolve, reject) => {
            const win: any = window;
            //const type = win.TEMPORARY;
            const type = win.PERSISTENT;
            const size = 5 * 1024 * 1024;
            win.requestFileSystem(type, size, successCallback, errorCallback)
            function successCallback(fs) {
                fs.root.getFile(filename, {}, function (fileEntry) {

                    fileEntry.file(function (file) {
                        const reader = new FileReader();
                        reader.onloadend = function (e) {
                            resolve(this.result as string);
                        };
                        reader.readAsText(file);
                    }, errorCallback);
                }, errorCallback);
            }
            function errorCallback(error) {
                console.debug(error);
                resolve(null);
            }
        });
    }
    writefile(filename: string, content: string) {
        return new Promise<void>(async (resolve, reject) => {
            const win: any = window;
            //const type = win.TEMPORARY;
            const type = win.PERSISTENT;
            const size = 5 * 1024 * 1024;
            win.requestFileSystem(type, size, successCallback, errorCallback)
            function successCallback(fs) {
                fs.root.getFile(filename, { create: true }, function (fileEntry) {
                    fileEntry.createWriter(function (fileWriter) {
                        fileWriter.onwriteend = function (e) {
                            resolve();
                        };
                        fileWriter.onerror = function (e) {
                            console.error('Write failed: ' + e.toString());
                            resolve();
                        };
                        const blob = new Blob([content], { type: 'text/plain' });
                        fileWriter.write(blob);
                    }, errorCallback);
                }, errorCallback);
            }
            function errorCallback(error) {
                console.error(error);
                resolve();
            }
        });
    }
    scanForQRScanner() {
        try {
            if (QRScanner !== undefined) {
                this.qrcodescan = true;
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
            } else {
                console.debug("QRScanner not definded");
                setTimeout(this.scanForQRScanner, 200);
            }
        } catch (error) {
            console.debug("Failed locating QRScanner");
            setTimeout(this.scanForQRScanner, 200);
        }
    }
    Scan() {
        try {
            if (this.scanning) {
                this.scanning = false;
                QRScanner.destroy();
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
                return;
            }
            this.scanning = true;
            QRScanner.scan(this.QRScannerHit.bind(this));
            QRScanner.show();
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
        } catch (error) {
            console.error("Error Scan");
            console.error(error);
        }
    }
    async QRScannerHit(err, value) {
        try {
            if (err) {
                console.error(err);
                return;
            }
            QRScanner.hide();
            QRScanner.destroy();

            this.scanning = false;
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
            if (value === null || value === undefined || value === "") {
                console.debug("QRCode had null value"); return;
            }
            console.debug("QRCode value: " + value);
            const config = JSON.parse(value);
            if (config.url !== null || config.url !== undefined || config.url !== "" || config.loginurl !== null || config.loginurl !== undefined || config.loginurl !== "") {
                await this.writefile("mobiledomain.txt", value);
                window.location.replace(config.url);
            }
        } catch (error) {
            console.error("Error QRScannerHit");
            console.error(error);

        }
    }
    BeginForgotPassword() {
        document.location.href = "/login?forgot=true";
    }
    async submit(): Promise<void> {
        this.message = "";
        try {
            const result: SigninMessage = await NoderedUtil.SigninWithUsername({ username: this.username, password: this.password });
            if (result.user == null) { return; }
            this.setCookie("jwt", result.jwt, 365);
            this.$location.path("/");
        } catch (error) {
            this.message = error.message ? error.message : error;
            console.error(error);
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    Signup() {
        this.$location.path("/Signup");
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    setCookie(cname, cvalue, exdays) {
        const d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        const expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }
    getCookie(cname) {
        const name = cname + "=";
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }
    usernameblur() {
        if (!NoderedUtil.IsNullEmpty(this.username) && this.username.indexOf("@") > -1) {
            var domain = this.username.substr(this.username.indexOf("@") + 1);
            if (this.WebSocketClientService.forceddomains && Array.isArray(this.WebSocketClientService.forceddomains)) {
                for (let d = 0; d < this.WebSocketClientService.forceddomains.length; d++) {
                    let forceddomain = new RegExp(this.WebSocketClientService.forceddomains[d], "i");
                    if (forceddomain.test(domain)) {
                        console.log("domain found in forceddomains");
                        document.getElementById("password").style.display = "none";
                        document.getElementById("localbuttons").style.display = "none";
                        this.message = "Please use provider button to login with this domain";
                        if (!this.$scope.$$phase) { this.$scope.$apply(); }
                        return;
                    }
                }
            }
        }
        this.message = "";
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
        document.getElementById("password").style.display = "block";
        document.getElementById("localbuttons").style.display = "block";
    }
}
export class ProvidersCtrl extends entitiesCtrl<Provider> {
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $interval, WebSocketClientService, api, userdata);
        console.debug("ProvidersCtrl");
        this.basequery = { _type: "provider" };
        this.collection = "config";
        this.skipcustomerfilter = true;
        WebSocketClientService.onSignedin((user: TokenUser) => {
            this.loadData();
        });
    }
}
export class ProviderCtrl extends entityCtrl<Provider> {
    public newforceddomain: string = "";
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $sce: ng.ISCEService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $sce, $interval, WebSocketClientService, api, userdata);
        console.debug("ProviderCtrl");
        this.collection = "config";
        WebSocketClientService.onSignedin((user: TokenUser) => {
            if (this.id !== null && this.id !== undefined) {
                this.loadData();
            } else {
                try {
                    this.model = new Provider("", "", "", "uri:" + this.WebSocketClientService.domain, "")
                } catch (error) {
                    this.model = {} as any;
                    this.model.name = "";
                    this.model._type = "provider";
                    this.model.issuer = "uri:" + this.WebSocketClientService.domain;
                }
            }
        });
    }
    async submit(): Promise<void> {
        try {
            if (this.model._id) {
                await NoderedUtil.UpdateOne({ collectionname: this.collection, item: this.model });
            } else {
                await NoderedUtil.InsertOne({ collectionname: this.collection, item: this.model });
            }
            this.$location.path("/Providers");
        } catch (error) {
            this.errormessage = error.message ? error.message : error;
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    deleteforceddomains(id) {
        if ((this.model as any).forceddomains === null || (this.model as any).forceddomains === undefined) {
            (this.model as any).forceddomains = [];
        }
        (this.model as any).forceddomains = (this.model as any).forceddomains.filter(function (m: any): boolean { return m !== id; });
    }
    addforceddomains() {
        if ((this.model as any).forceddomains === null || (this.model as any).forceddomains === undefined) {
            (this.model as any).forceddomains = [];
        }
        var v = this.newforceddomain;
        try {
            v = JSON.parse(v);
        } catch (error) {
        }
        (this.model as any).forceddomains.push(v);
    }
}
export class UsersCtrl extends entitiesCtrl<TokenUser> {
    public stripe: any = null;
    public proration: boolean = false;
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $interval, WebSocketClientService, api, userdata);
        this.autorefresh = true;
        console.debug("UsersCtrl");
        this.basequery = { _type: "user" };
        this.collection = "users";
        this.searchfields = ["name", "username", "federationids", "federationids.id"];
        this.postloadData = this.processData;
        if (this.userdata.data.UsersCtrl) {
            this.basequery = this.userdata.data.UsersCtrl.basequery;
            this.collection = this.userdata.data.UsersCtrl.collection;
            this.baseprojection = this.userdata.data.UsersCtrl.baseprojection;
            this.orderby = this.userdata.data.UsersCtrl.orderby;
            this.searchstring = this.userdata.data.UsersCtrl.searchstring;
            this.basequeryas = this.userdata.data.UsersCtrl.basequeryas;
            this.skipcustomerfilter = this.userdata.data.UsersCtrl.skipcustomerfilter;
        }
        WebSocketClientService.onSignedin(async (user: TokenUser) => {
            let haderror: boolean = false;
            if (!NoderedUtil.IsNullEmpty(this.WebSocketClientService.stripe_api_key)) {
                try {
                    this.stripe = Stripe(this.WebSocketClientService.stripe_api_key);
                } catch (error) {
                    haderror = true;
                }
                if (haderror) {
                    await jsutil.loadScript('//js.stripe.com/v3/');
                    this.stripe = Stripe(this.WebSocketClientService.stripe_api_key);
                }
            }
            this.loadData();
        });
    }
    async processData(): Promise<void> {
        if (!this.userdata.data.UsersCtrl) this.userdata.data.UsersCtrl = {};
        this.userdata.data.UsersCtrl.basequery = this.basequery;
        this.userdata.data.UsersCtrl.collection = this.collection;
        this.userdata.data.UsersCtrl.baseprojection = this.baseprojection;
        this.userdata.data.UsersCtrl.orderby = this.orderby;
        this.userdata.data.UsersCtrl.searchstring = this.searchstring;
        this.userdata.data.UsersCtrl.basequeryas = this.basequeryas;
        this.userdata.data.UsersCtrl.skipcustomerfilter = this.skipcustomerfilter;
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    async Impersonate(model: TokenUser): Promise<any> {
        try {
            this.loading = true;
            await this.WebSocketClientService.impersonate(model._id);
            this.loading = false;
            this.loadData();
        } catch (error) {
            this.errormessage = JSON.stringify(error);
        }
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    public Resources: Resource[];
    public Assigned: ResourceUsage[];
    public user: TokenUser;
    async ShowPlans(user: TokenUser) {
        try {
            this.errormessage = "";
            this.user = user;
            this.proration = false;
            // var title = document.getElementById("title");
            // title.scrollIntoView();
            this.ToggleModal()
            this.Resources = await NoderedUtil.Query({
                collectionname: "config", query: { "_type": "resource", "target": "user", "allowdirectassign": true },
                orderby: { _created: -1, "order": 1 }
            });
            this.Assigned = await NoderedUtil.Query({ collectionname: "config", query: { "_type": "resourceusage", "userid": user._id }, orderby: { _created: -1 } });
            for (var i = this.Resources.length - 1; i >= 0; i--) {
                var res = this.Resources[i];
                for (var prod of res.products) {
                    (prod as any).count = this.AssignCount(prod);
                    if ((prod as any).count > 0) {
                        (res as any).newproduct = prod;
                    }
                }
                res.products = res.products.filter(x => x.allowdirectassign == true || (x as any).count > 0);
            }

        } catch (error) {
            this.errormessage = error;
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    AssignCount(Product: ResourceVariant) {
        const assigned = this.Assigned.filter(x => x.product.stripeprice == Product.stripeprice && x.quantity > 0 && x.siid != null);
        return assigned.length;
    }
    ToggleModal() {
        var modal = document.getElementById("resourceModal");
        modal.classList.toggle("show");
    }
    CloseModal() {
        var modal = document.getElementById("resourceModal");
        modal.classList.remove("show");
    }
    ToggleNextInvoiceModal() {
        var modal = document.getElementById("NextInvoiceModal");
        modal.classList.toggle("show");
    }
    CloseNextInvoiceModal() {
        var modal = document.getElementById("NextInvoiceModal");
        modal.classList.remove("show");
    }
    async RemovePlan(resource: Resource, product: ResourceVariant) {
        try {
            this.CloseNextInvoiceModal();
            this.loading = true;
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
            const assigned = this.Assigned.filter(x => x.product.stripeprice == product.stripeprice);
            if (assigned.length > 0) {
                await NoderedUtil.StripeCancelPlan({ resourceusageid: assigned[0]._id });
            }
            this.loading = false;
            this.CloseModal();
            this.loadData();
            this.loading = false;

        } catch (error) {
            this.loading = false;
            this.errormessage = error;
            try {
                this.CloseNextInvoiceModal();
                this.CloseModal();
            } catch (error) {
            }
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    async AddPlan2() {
        try {
            this.loading = true;
            this.CloseNextInvoiceModal();
            this.CloseModal();
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
            var result = await NoderedUtil.StripeAddPlan({
                userid: this.user._id, customerid: this.user.customerid,
                resourceid: this.resource._id, stripeprice: this.product.stripeprice
            });
            var checkout = result.checkout;
            if (checkout) {
                const stripe = Stripe(this.WebSocketClientService.stripe_api_key);
                stripe
                    .redirectToCheckout({
                        sessionId: checkout.id,
                    })
                    .then(function (event) {
                        if (event.complete) {
                            // enable payment button
                        } else if (event.error) {
                            console.error(event.error);
                            if (event.error && event.error.message) {
                                this.cardmessage = event.error.message;
                            } else {
                                this.cardmessage = event.error;
                            }
                            console.error(event.error);

                            // show validation to customer
                        } else {
                        }
                    }).catch((error) => {
                        console.error(error);
                        this.errormessage = error;
                    });
            } else {
                this.loading = false;
                this.loadData();
            }
        } catch (error) {
            this.loading = false;
            this.errormessage = error;
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    private resource: Resource;
    private product: ResourceVariant;
    public nextinvoice: stripe_invoice;
    public period_start: string;
    public period_end: string;
    async AddPlan(resource: Resource, product: ResourceVariant) {
        try {
            this.resource = resource;
            this.product = product;

            this.loading = true;
            this.errormessage = "";

            let items = [];
            items.push({ quantity: 1, price: product.stripeprice });
            if (this.user) {
                // If customer is created in stripe and has a subscriptuon we can calculate new invoice
                // if not, just ignore the error and send them to tripe to see the price for current product.
                try {
                    this.nextinvoice = await NoderedUtil.GetNextInvoice({ customerid: this.user.customerid, subscription_items: items })
                } catch (error) {
                    this.loading = false;
                    if (error != "Need customer to work with invoices_upcoming") {
                        this.errormessage = error;
                    }
                }
            }
            if (this.nextinvoice != null) {
                const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                const period_start = new Date(this.nextinvoice.period_start * 1000);
                const period_end = new Date(this.nextinvoice.period_end * 1000);
                this.period_start = period_start.getDate() + " " + monthNames[period_start.getMonth()] + " " + period_start.getFullYear();
                this.period_end = period_end.getDate() + " " + monthNames[period_end.getMonth()] + " " + period_end.getFullYear();

                this.proration = true;
                this.ToggleNextInvoiceModal();
                this.loading = false;
            } else {
                this.AddPlan2();
            }
        } catch (error) {
            this.loading = false;
            this.errormessage = error;
            try {
                var modal = document.getElementById("resourceModal");
                modal.classList.toggle("show");
            } catch (error) {
            }
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
}
export class UserCtrl extends entityCtrl<TokenUser> {
    public newid: string;
    public memberof: Role[];
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $sce: ng.ISCEService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $sce, $interval, WebSocketClientService, api, userdata);
        console.debug("UserCtrl");
        this.collection = "users";
        this.postloadData = this.processdata;
        this.memberof = [];
        WebSocketClientService.onSignedin((user: TokenUser) => {
            if (this.id !== null && this.id !== undefined) {
                this.loadData();
            } else {
                this.model = new TokenUser();
                this.model._type = "user";
                this.model.name = "";
                this.model.username = "";
                (this.model as any).newpassword = "";
                (this.model as any).sid = "";
                (this.model as any).federationids = [];
                this.model.validated = true;
                this.model.emailvalidated = true;
                this.model.formvalidated = true;
                if (!NoderedUtil.IsNullEmpty(WebSocketClient.instance.user.selectedcustomerid)) {
                    this.model.customerid = WebSocketClient.instance.user.selectedcustomerid;
                }
                this.processdata();
            }

        });
    }
    async processdata() {
        if (this.model != null && (this.model._id != null && this.model._id != "")) {
            if (this.model._id == WebSocketClient.instance.user._id) {
                this.memberof = WebSocketClient.instance.user.roles as any;
            } else {
                this.memberof = await NoderedUtil.Query({
                    collectionname: "users",
                    query: {
                        $and: [
                            { _type: "role" },
                            { members: { $elemMatch: { _id: this.model._id } } }
                        ]
                    }, orderby: { _type: -1, name: 1 }
                });
            }
        } else {
            this.memberof = [];
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    deleteid(id) {
        if ((this.model as any).federationids === null || (this.model as any).federationids === undefined) {
            (this.model as any).federationids = [];
        }
        (this.model as any).federationids = (this.model as any).federationids.filter(function (m: any): boolean { return m !== id; });
    }
    addid() {
        if ((this.model as any).federationids === null || (this.model as any).federationids === undefined) {
            (this.model as any).federationids = [];
        }
        var v = this.newid;
        try {
            v = JSON.parse(v);
        } catch (error) {
        }
        (this.model as any).federationids.push(v);
    }
    removedmembers: Role[] = [];
    RemoveMember(model: Role) {
        this.removedmembers.push(model);
        this.memberof = this.memberof.filter(x => x._id != model._id);
    }
    async submit(): Promise<void> {
        try {
            this.loading = true;
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
            if (this.model._id) {
                await NoderedUtil.UpdateOne({ collectionname: this.collection, item: this.model });
            } else {
                await NoderedUtil.InsertOne({ collectionname: this.collection, item: this.model });
            }
            if (this.removedmembers.length > 0) {
                for (let i = 0; i < this.removedmembers.length; i++) {
                    var roles;
                    var role;
                    try {
                        roles = await NoderedUtil.Query({ collectionname: "users", query: { _type: "role", _id: this.removedmembers[i]._id }, orderby: { _type: -1, name: 1 }, top: 5 });
                        if (roles.length > 0) {
                            role = roles[0];
                            if (role.members === null || role.members === undefined) {
                                continue;
                            }
                            const exists = role.members.filter(x => x._id == this.model._id);
                            if (exists.length > 0) {
                                role.members = role.members.filter(x => x._id != this.model._id);
                                try {
                                    await NoderedUtil.UpdateOne({ collectionname: "users", item: role });
                                } catch (error) {
                                    console.error("Error updating " + role.name, error);
                                }
                            }

                        }
                    } catch (error) {
                        console.log(roles, roles)
                        console.error(error);
                    }
                }
            }
            this.loading = false;
            this.$location.path("/Users");
        } catch (error) {
            console.error(error);
            this.loading = false;
            this.errormessage = error.message ? error.message : error;
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
}
export class RolesCtrl extends entitiesCtrl<Role> {
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $interval, WebSocketClientService, api, userdata);
        this.autorefresh = true;
        console.debug("RolesCtrl");
        this.basequery = { _type: "role" };
        this.collection = "users";
        this.postloadData = this.processdata;
        if (this.userdata.data.RolesCtrl) {
            this.basequery = this.userdata.data.RolesCtrl.basequery;
            this.collection = this.userdata.data.RolesCtrl.collection;
            this.baseprojection = this.userdata.data.RolesCtrl.baseprojection;
            this.orderby = this.userdata.data.RolesCtrl.orderby;
            this.searchstring = this.userdata.data.RolesCtrl.searchstring;
            this.basequeryas = this.userdata.data.RolesCtrl.basequeryas;
            this.skipcustomerfilter = this.userdata.data.RolesCtrl.skipcustomerfilter;
        }
        WebSocketClientService.onSignedin((user: TokenUser) => {
            this.loadData();
        });
    }
    processdata() {
        if (!this.userdata.data.RolesCtrl) this.userdata.data.RolesCtrl = {};
        this.userdata.data.RolesCtrl.basequery = this.basequery;
        this.userdata.data.RolesCtrl.collection = this.collection;
        this.userdata.data.RolesCtrl.baseprojection = this.baseprojection;
        this.userdata.data.RolesCtrl.orderby = this.orderby;
        this.userdata.data.RolesCtrl.searchstring = this.searchstring;
        this.userdata.data.RolesCtrl.basequeryas = this.basequeryas;
        this.userdata.data.RolesCtrl.skipcustomerfilter = this.skipcustomerfilter;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
}
export class RoleCtrl extends entityCtrl<Role> {
    searchFilteredList: Role[] = [];
    searchSelectedItem: Role = null;
    searchtext: string = "";
    e: any = null;

    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $sce: ng.ISCEService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $sce, $interval, WebSocketClientService, api, userdata);
        console.debug("RoleCtrl");
        this.collection = "users";
        WebSocketClientService.onSignedin(async (user: TokenUser) => {
            if (this.id !== null && this.id !== undefined) {
                await this.loadData();
            } else {
                this.model = new Role();
                if (!NoderedUtil.IsNullEmpty(WebSocketClient.instance.user.selectedcustomerid)) {
                    this.model.customerid = WebSocketClient.instance.user.selectedcustomerid;
                }
            }
        });
    }
    async submit(): Promise<void> {
        try {
            if (this.model._id) {
                await NoderedUtil.UpdateOne({ collectionname: this.collection, item: this.model });
            } else {
                this.model = await NoderedUtil.InsertOne({ collectionname: this.collection, item: this.model });
            }
            this.$location.path("/Roles");
        } catch (error) {
            console.error(error);
            this.errormessage = error.message ? error.message : error;
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    RemoveMember(model: any) {
        if (this.model.members === undefined) { this.model.members = []; }
        for (let i: number = 0; i < this.model.members.length; i++) {
            if (this.model.members[i]._id === model._id) {
                this.model.members.splice(i, 1);
            }
        }
    }
    AddMember(model: any) {
        if (this.model.members === undefined) { this.model.members = []; }
        const user: any = this.searchSelectedItem;;
        this.model.members.push({ name: user.name, _id: user._id });
        this.searchSelectedItem = null;
        this.searchtext = "";
    }



    restrictInput(e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            return false;
        }
    }
    setkey(e) {
        this.e = e;
        this.handlekeys();
    }
    handlekeys() {
        if (this.searchFilteredList.length > 0) {
            let idx: number = -1;
            for (let i = 0; i < this.searchFilteredList.length; i++) {
                if (this.searchSelectedItem != null) {
                    if (this.searchFilteredList[i]._id == this.searchSelectedItem._id) {
                        idx = i;
                    }
                }
            }
            if (this.e.keyCode == 38) { // up
                if (idx <= 0) {
                    idx = 0;
                } else { idx--; }
                // this.searchtext = this.searchFilteredList[idx].name;
                this.searchSelectedItem = this.searchFilteredList[idx];
                return;
            }
            else if (this.e.keyCode == 40) { // down
                if (idx >= this.searchFilteredList.length) {
                    idx = this.searchFilteredList.length - 1;
                } else { idx++; }
                // this.searchtext = this.searchFilteredList[idx].name;
                this.searchSelectedItem = this.searchFilteredList[idx];
                return;
            }
            else if (this.e.keyCode == 13) { // enter
                if (idx >= 0) {
                    this.searchtext = this.searchFilteredList[idx].name;
                    this.searchSelectedItem = this.searchFilteredList[idx];
                    this.searchFilteredList = [];
                    if (!this.$scope.$$phase) { this.$scope.$apply(); }
                }
                return;
            } else if (this.e.keyCode == 27) { // esc
                this.searchtext = "";
                this.searchFilteredList = [];
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
            }
        } else {
            if (this.e.keyCode == 13 && this.searchSelectedItem != null) {
                this.AddMember(this.searchSelectedItem);
            }
        }
    }
    async handlefilter(e) {
        this.e = e;
        const ids: string[] = this.model.members.map(item => item._id);
        this.searchFilteredList = await NoderedUtil.Query({
            collectionname: "users",
            query: {
                $and: [
                    { $or: [{ _type: "user" }, { _type: "role" }] },
                    { name: this.searchtext }
                ]
            }
            , orderby: { _type: -1, name: 1 }, top: 2
        });

        this.searchFilteredList = this.searchFilteredList.concat(await NoderedUtil.Query({
            collectionname: "users",
            query: {
                $and: [
                    { $or: [{ _type: "user" }, { _type: "role" }] },
                    {
                        $or: [
                            { name: new RegExp([this.searchtext].join(""), "i") },
                            { email: new RegExp([this.searchtext].join(""), "i") },
                            { username: new RegExp([this.searchtext].join(""), "i") }
                        ]
                    },
                    { _id: { $nin: ids } }
                ]
            }
            , orderby: { _type: -1, name: 1 }, top: 5
        }));
        // this.searchFilteredList = await NoderedUtil.Query("users",
        //     {
        //         $and: [
        //             { $or: [{ _type: "user" }, { _type: "role" }] },
        //             { name: new RegExp([this.searchtext].join(""), "i") },
        //             { _id: { $nin: ids } }
        //         ]
        //     }
        //     , null, { _type: -1, name: 1 }, 8, 0, null);
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    fillTextbox(searchtext) {
        this.searchFilteredList.forEach((item: any) => {
            if (item.name.toLowerCase() == searchtext.toLowerCase()) {
                this.searchtext = item.name;
                this.searchSelectedItem = item;
                this.searchFilteredList = [];
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
            }
        });
    }
}
export class FilesCtrl extends entitiesCtrl<Base> {
    public file: string;
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $interval, WebSocketClientService, api, userdata);
        console.debug("EntitiesCtrl");
        this.autorefresh = true;
        this.basequery = {};
        this.searchfields = ["metadata.name"];
        this.orderby = { "metadata._created": -1 }
        this.collection = "fs.files";
        this.baseprojection = { _type: 1, type: 1, name: 1, _created: 1, _createdby: 1, _modified: 1, length: 1 };
        const elem = document.getElementById("myBar");
        elem.style.width = '0%';
        WebSocketClientService.onSignedin((user: TokenUser) => {
            this.loadData();
        });
    }
    async Download(id: string) {
        const lastp: number = 0;

        const fileinfo = await NoderedUtil.GetFile({ id });

        const elem = document.getElementById("myBar");
        elem.style.width = '0%';
        elem.innerText = '';
        const blob = this.b64toBlob(fileinfo.file, fileinfo.mimeType);
        // const blobUrl = URL.createObjectURL(blob);
        // (window.location as any) = blobUrl;
        const anchor = document.createElement('a');
        anchor.download = fileinfo.metadata.name;
        anchor.href = ((window as any).webkitURL || window.URL).createObjectURL(blob);
        anchor.dataset.downloadurl = [fileinfo.mimeType, anchor.download, anchor.href].join(':');
        anchor.click();
    }
    b64toBlob(b64Data: string, contentType: string, sliceSize: number = 512) {
        contentType = contentType || '';
        sliceSize = sliceSize || 512;
        const byteCharacters = atob(b64Data);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        const blob = new Blob(byteArrays, { type: contentType });
        return blob;
    }
    async Upload() {
        // const e: any = document.querySelector('input[type="file"]');
        const e: any = document.getElementById('fileupload')
        const fd = new FormData();
        for (let i = 0; i < e.files.length; i++) {
            const file = e.files[i];
            fd.append(e.name, file, file.name);
        };
        const xhr = new XMLHttpRequest();
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                // we done!
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
                this.loadData();

            }
        };
        xhr.open('POST', '/upload', true);
        xhr.send(fd);
    }
    async Upload_usingapi() {
        try {
            const filename = (this.$scope as any).filename;
            const mimeType = (this.$scope as any).type;
            this.loading = true;
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
            const lastp: number = 0;
            await NoderedUtil.SaveFile({ filename, mimeType, file: this.file, compressed: false });
            const elem = document.getElementById("myBar");
            elem.style.width = '0%';
            elem.innerText = '';
            this.loading = false;

        } catch (error) {
            console.error(error);
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
        this.loadData();
    }
}
export class EntitiesCtrl extends entitiesCtrl<Base> {
    public collections: any;
    public showrunning: boolean = false;
    public showpending: boolean = false;
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $interval, WebSocketClientService, api, userdata);
        console.debug("EntitiesCtrl");
        this.autorefresh = true;
        this.basequery = {};
        this.collection = $routeParams.collection;
        if(this.collection?.endsWith(".files")) {
            this.searchfields = ["filename", "metadata.name"];
        }
        this.baseprojection = { _type: 1, type: 1, name: 1, _created: 1, _createdby: 1, _modified: 1, 
            "metadata.name": 1, "metadata._type": 1, "metadata._created": 1, "metadata._createdby": 1, "metadata._modified": 1 };
        this.postloadData = this.processdata;
        if (this.userdata.data.EntitiesCtrl) {
            this.basequery = this.userdata.data.EntitiesCtrl.basequery;
            this.collection = this.userdata.data.EntitiesCtrl.collection;
            this.baseprojection = this.userdata.data.EntitiesCtrl.baseprojection;
            this.orderby = this.userdata.data.EntitiesCtrl.orderby;
            this.searchstring = this.userdata.data.EntitiesCtrl.searchstring;
            this.basequeryas = this.userdata.data.EntitiesCtrl.basequeryas;
            this.showrunning = this.userdata.data.EntitiesCtrl.showrunning;
            this.showpending = this.userdata.data.EntitiesCtrl.showpending;
        } else {
            if (NoderedUtil.IsNullEmpty(this.collection)) {
                this.$location.path("/Entities/entities");
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
                return;
            }
        }
        if (NoderedUtil.IsNullEmpty(this.collection)) {
            this.$location.path("/Entities/entities");
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
            return;
        } else if (this.$location.path() != "/Entities/" + this.collection) {
            this.$location.path("/Entities/" + this.collection);
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
            return;
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
        this.preloadData = () => {
            if (this.showrunning && this.collection == "openrpa_instances") {
                this.basequery = { "state": { "$in": ["idle", "running"] } };
            } else if (this.showpending && this.collection == "config") {
                this.basequery = { "$or": [{ "siid": { "$exists": false } }, { "siid": null }], "_type": "resourceusage" };
            } else {
                this.basequery = {};
            }
        };
        WebSocketClientService.onSignedin(async (user: TokenUser) => {
            try {
                if (this.collection == "audit") {
                    if (this.orderby && this.orderby["_id"]) {
                        this.orderby["_created"] = this.orderby["_id"];
                        delete this.orderby["_id"];
                    }
                }
                this.loadData();
                this.collections = await NoderedUtil.ListCollections({});
            } catch (error) {
                this.errormessage = error;
            }
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
        });
    }
    processdata() {
        if (!this.userdata.data.EntitiesCtrl) this.userdata.data.EntitiesCtrl = {};
        this.userdata.data.EntitiesCtrl.basequery = this.basequery;
        this.userdata.data.EntitiesCtrl.collection = this.collection;
        this.userdata.data.EntitiesCtrl.baseprojection = this.baseprojection;
        this.userdata.data.EntitiesCtrl.orderby = this.orderby;
        this.userdata.data.EntitiesCtrl.searchstring = this.searchstring;
        this.userdata.data.EntitiesCtrl.basequeryas = this.basequeryas;
        this.userdata.data.EntitiesCtrl.showrunning = this.showrunning;
        this.userdata.data.EntitiesCtrl.showpending = this.showpending;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    SelectCollection() {
        if (!this.userdata.data.EntitiesCtrl) this.userdata.data.EntitiesCtrl = {};
        this.userdata.data.EntitiesCtrl.collection = this.collection;
        this.$location.path("/Entities/" + this.collection);
        //this.$location.hash("#/Entities/" + this.collection);
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
        // this.loadData();
    }
    async DropCollection() {
        await NoderedUtil.DropCollection({ collectionname: this.collection });
        this.collections = await NoderedUtil.ListCollections({});
        this.collection = "entities";
        this.loadData();
    }
}
export class FormsCtrl extends entitiesCtrl<Base> {
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $interval, WebSocketClientService, api, userdata);
        console.debug("FormsCtrl");
        this.autorefresh = true;
        this.collection = "forms";
        this.basequery = { "_type": "form" }
        this.baseprojection = { _type: 1, type: 1, name: 1, _created: 1, _createdby: 1, _modified: 1 };
        WebSocketClientService.onSignedin((user: TokenUser) => {
            this.loadData();
        });
    }
}
export class FormResourcesCtrl extends entitiesCtrl<Base> {
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $interval, WebSocketClientService, api, userdata);
        console.debug("FormsCtrl");
        this.autorefresh = true;
        this.collection = "forms";
        this.basequery = { "_type": "resource" }
        this.baseprojection = { _type: 1, type: 1, name: 1, _created: 1, _createdby: 1, _modified: 1 };
        WebSocketClientService.onSignedin((user: TokenUser) => {
            this.loadData();
        });
    }
}
export class FormResourceCtrl extends entityCtrl<Base> {
    public newforceddomain: string = "";
    public collections: any[];
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $sce: ng.ISCEService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $sce, $interval, WebSocketClientService, api, userdata);
        console.debug("FormResourceCtrl");
        this.collection = "forms";
        this.postloadData = this.postload;
        WebSocketClientService.onSignedin(async (user: TokenUser) => {
            this.collections = await NoderedUtil.ListCollections({});
            if (this.id !== null && this.id !== undefined) {
                this.loadData();
            } else {
                try {
                    this.model = new Base()
                    this.model._type = "resource";
                    // @ts-ignore
                    this.model.collection = "entities"
                    this.model.name = "entities"
                    // @ts-ignore
                    this.model.aggregates = [{ "$match": {} }, { "$project": { "name": 1, "_type": 1 } }];
                } catch (error) {
                    this.model = {} as any;
                    this.model.name = "ente";
                    this.model._type = "resource";
                    // @ts-ignore
                    this.model.collection = "entities"
                    this.model.name = "entities"
                    // @ts-ignore
                    this.model.aggregates = [{ "$match": {} }, { "$project": { "name": 1, "_type": 1 } }];
                }
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
                this.fixtextarea()
            }
        });
    }
    collapsobject(o) {
        const keys = Object.keys(o);
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            if (key.startsWith("$")) {
                let newkey = "___" + key.substr(1);
                o[newkey] = o[key];
                delete o[key];
                key = newkey;
            }
            if (typeof (o[key]) === "object") {
                this.collapsobject(o[key]);
            }
        }
    }
    expandobject(o) {
        const keys = Object.keys(o);
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            if (key.startsWith("___")) {
                let newkey = "$" + key.substr(3);
                o[newkey] = o[key];
                delete o[key];
                key = newkey;
            }
            if (typeof (o[key]) === "object") {
                this.expandobject(o[key]);
            }
        }
    }
    postload() {
        if (this.model) {
            this.expandobject(this.model);
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
        this.fixtextarea()
    }
    async submit(): Promise<void> {
        try {
            this.collapsobject(this.model);
            if (this.model._id) {
                await NoderedUtil.UpdateOne({ collectionname: this.collection, item: this.model });
            } else {
                await NoderedUtil.InsertOne({ collectionname: this.collection, item: this.model });
            }
            this.$location.path("/FormResources");
        } catch (error) {
            this.errormessage = error.message ? error.message : error;
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    fixtextarea() {
        setTimeout(() => {
            const tx = document.getElementsByTagName('textarea');
            for (let i = 0; i < tx.length; i++) {
                tx[i].setAttribute('style', 'height:' + (tx[i].scrollHeight) + 'px;overflow-y:hidden;');
            }
        }, 500);
    }

}
export class EditFormCtrl extends entityCtrl<Form> {
    public message: string = "";
    public charts: chartset[] = [];
    public formBuilder: any;
    public Formiobuilder: any;
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $sce: ng.ISCEService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $sce, $interval, WebSocketClientService, api, userdata);
        console.debug("EditFormCtrl");
        this.collection = "forms";
        this.basequery = {};
        this.id = $routeParams.id;
        this.basequery = { _id: this.id };
        this.postloadData = this.renderform;
        this.
            WebSocketClientService.onSignedin(async (user: TokenUser) => {
                if (this.id !== null && this.id !== undefined && this.id !== "") {
                    this.basequery = { _id: this.id };
                    this.loadData();
                } else {
                    try {
                        this.model = new Form();
                    } catch (error) {
                        this.model = {} as any;
                        this.model._type = "form";
                        this.model.dataType = "json";
                        this.model.formData = { "display": "form" };
                    }
                    this.model.fbeditor = false;
                    this.renderform();
                }

            });
    }
    async Save() {
        if (this.model.fbeditor == true) {
            this.model.formData = this.formBuilder.actions.getData(this.model.dataType);
        } else {
            // allready there
        }
        try {
            if (this.model._id) {
                this.model = await NoderedUtil.UpdateOne({ collectionname: this.collection, item: this.model });
            } else {
                this.model = await NoderedUtil.InsertOne({ collectionname: this.collection, item: this.model });
            }
            this.$location.path("/Forms");
        } catch (error) {
            this.errormessage = error;
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    async renderform() {
        if (this.model.fbeditor == null || this.model.fbeditor == undefined) this.model.fbeditor = true;
        if ((this.model.fbeditor as any) == "true") this.model.fbeditor = true;
        if ((this.model.fbeditor as any) == "false") this.model.fbeditor = false;
        if (this.model.fbeditor == true) {
            // https://www.npmjs.com/package/angular2-json-schema-form
            // http://www.alpacajs.org/demos/form-builder/form-builder.html
            // https://github.com/kevinchappell/formBuilder - https://formbuilder.online/ - https://kevinchappell.github.io/formBuilder/
            const roles: any = {};
            WebSocketClient.instance.user.roles.forEach(role => {
                roles[role._id] = role.name;
            });

            const fbOptions = {
                formData: this.model.formData,
                dataType: this.model.dataType,
                roles: roles,
                disabledActionButtons: ['data', 'clear'],
                onSave: this.Save.bind(this),
            };
            await jsutil.ensureJQuery();
            const ele: any = $(document.getElementById('fb-editor'));
            if (this.formBuilder == null || this.formBuilder == undefined) {
                if (ele.formBuilder == null) {
                    // await this.loadScript("jquery.min.js");
                    await jsutil.loadScript("jquery-ui.min.js");
                    await jsutil.loadScript("form-builder.min.js");
                    await jsutil.loadScript("form-render.min.js");
                }
                this.formBuilder = await ele.formBuilder(fbOptions).promise;
            }
        } else {
            try {
                const test = Formio.builder;
            } catch (error) {
                await jsutil.loadScript("formio.full.min.js");
            }
            try {
                const storage = "url";
                const Providers = Formio.Providers
                const p = Providers.getProviders('storage');
                Providers.providers['storage'] = { "url": ofurl.default };

                const Provider = Providers.getProvider('storage', storage);
                const provider = new Provider(this);
            } catch (error) {
                console.error(error);
            }
            if (this.model.formData == null || this.model.formData == undefined) { this.model.formData = {}; }
            if (NoderedUtil.IsNullEmpty(this.model.formData.display)) this.model.formData.display = "form";
            let protocol = "http:";
            if (this.WebSocketClientService.wsurl.startsWith("wss")) protocol = "https:";
            Formio.setBaseUrl(protocol + '//' + this.WebSocketClientService.domain);
            Formio.setProjectUrl(protocol + '//' + this.WebSocketClientService.domain);
            this.Formiobuilder = await Formio.builder(document.getElementById('builder'), this.model.formData,
                {
                    noAlerts: false,
                    breadcrumbSettings: { clickable: false },
                    buttonSettings: { showCancel: false },
                    builder: {
                        resource: false,
                        // data: false,
                        // premium: false
                        premium: false,
                        basic: false,
                        customBasic: {
                            title: 'Basic',
                            default: true,
                            weight: 0,
                            components: {
                                file: true,
                                textfield: true,
                                textarea: true,
                                number: true,
                                password: true,
                                checkbox: true,
                                selectboxes: true,
                                select: true,
                                radio: true,
                                button: true,
                            }

                        }
                    },
                    hooks: {
                        customValidation: function (submission, next) {
                        }
                    }

                });
            // this.Formiobuilder.hook('customValidation', { ...submission, component: options.component }, (err) => {
            this.Formiobuilder.options.hooks.beforeSubmit = (submission, callback) => {
            };

            this.Formiobuilder.url = "/formio";
            this.Formiobuilder.on('change', form => {
                this.model.schema = form;
            })
            this.Formiobuilder.on('submit', submission => {
            })
            this.Formiobuilder.on('error', (errors) => {
                console.error(errors);
            })
        }
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
}
export class FormCtrl extends entityCtrl<WorkflowInstance> {
    public message: string = "";
    public formRender: any;
    public formioRender: any;
    public workflow: Workflow;
    public form: Form;
    public instanceid: string;
    public myid: string;
    public submitbutton: string;
    public queuename: string;
    public localexchangequeue: string;
    public queue_message_timeout: number = 1000;

    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $sce: ng.ISCEService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $sce, $interval, WebSocketClientService, api, userdata);
        this.myid = new Date().toISOString();
        console.debug("FormCtrl");
        this.collection = "workflow";
        this.basequery = {};
        this.id = $routeParams.id;
        this.instanceid = $routeParams.instance;

        this.basequery = { _id: this.id };
        WebSocketClientService.onSignedin(async (user: TokenUser) => {
            await jsutil.ensureJQuery();
            await this.RegisterQueue();
            if (this.id !== null && this.id !== undefined && this.id !== "") {
                this.basequery = { _id: this.id };
                this.loadData();
            } else {
                this.errormessage = "missing id";
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
                console.error(this.errormessage);
            }
        });

    }
    async RegisterExchange(exchange: string) {
        if (!NoderedUtil.IsNullEmpty(this.localexchangequeue)) return;
        const result = await NoderedUtil.RegisterExchange(
            {
                exchangename: exchange, algorithm: "direct", callback: async (msg: QueueMessage, ack: any) => {
                    ack();
                    if (NoderedUtil.IsNullEmpty(msg.routingkey) || msg.routingkey == this.instanceid) {
                        // this.loadData();
                        this.model.payload = Object.assign(this.model.payload, msg.data.payload);
                        if (!NoderedUtil.IsNullEmpty(msg.data.payload.form)) {
                            if (msg.data.payload.form != this.model.form) {
                                const res = await NoderedUtil.Query({
                                    collectionname: "forms", query: { _id: msg.data.payload.form },
                                    orderby: { _created: -1 }, top: 1
                                });
                                if (res.length > 0) {
                                    this.model.form = msg.data.payload.form;
                                    this.form = res[0];
                                } else {
                                    console.error("Failed locating form " + msg.data.payload.form)
                                }
                            }
                        }
                        this.renderform();
                    }
                }, closedcallback: (msg) => {
                    // if (this != null && this.node != null) this.node.status({ fill: "red", shape: "dot", text: "Disconnected" });
                    // setTimeout(this.connect.bind(this), (Math.floor(Math.random() * 6) + 1) * 500);
                }
            });
        this.localexchangequeue = result.queuename;
    }
    async RegisterQueue() {
        this.queuename = await NoderedUtil.RegisterQueue({
            callback: (data: QueueMessage, ack: any) => {
                ack();
                if (data.queuename == this.queuename) {
                    if (data && data.data && data.data.command == "timeout") {
                        this.errormessage = "No \"workflow in\" node listening or message timed out, is nodered running?";
                        console.error(this.errormessage);
                        if (!this.$scope.$$phase) { this.$scope.$apply(); }
                        return;
                    } else {
                        this.queue_message_timeout = (60 * 1000); // 1 min
                    }
                    if (data != null && data.error != null) {
                        this.errormessage = data.error;
                    } else if (data != null && data.data != null && data.data.error != null) {
                        this.errormessage = data.data.error;
                    } else {
                        this.errormessage = "";
                    }
                    if (this.instanceid == null && data.data._id != null) {
                        this.instanceid = data.data._id;
                        // this.$location.path("/Form/" + this.id + "/" + this.instanceid);
                        // if (!this.$scope.$$phase) { this.$scope.$apply(); }
                        this.loadData();
                        return;
                    } else {
                        this.loadData();
                    }
                }
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
            }, closedcallback: (msg) => {
                this.queuename = "";
                setTimeout(this.RegisterQueue.bind(this), (Math.floor(Math.random() * 6) + 1) * 500);
            }
        });
    }
    async hideFormElements() {
        $('input[ref="component"]').prop("disabled", true);
        $('#workflowform :input').prop("disabled", true);
        $('#workflowform :button').prop("disabled", true);
        $('#workflowform :input').addClass("disabled");
        $('#workflowform :button').addClass("disabled");
        $('#workflowform choices__list').hide();
        $('#workflowform .form-group').addClass("is-disabled");
        $('#workflowform .form-group').prop("isDisabled", true);


        // $('.form-control').addClass("disabled");
        // $('.dropdown').attr("checked", "checked");;

        $('#workflowform :button').hide();
        $('input[type="submit"]').hide();

    }
    async loadData(): Promise<void> {
        this.loading = true;
        this.message = "";
        const res = await NoderedUtil.Query({ collectionname: this.collection, query: this.basequery, orderby: { _created: -1 }, top: 1 });
        if (res.length > 0) { this.workflow = res[0]; } else {
            this.errormessage = this.id + " workflow not found!";
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
            console.error(this.errormessage);
            return;
        }
        if (this.instanceid !== null && this.instanceid !== undefined && this.instanceid !== "") {
            const res = await NoderedUtil.Query({ collectionname: "workflow_instances", query: { _id: this.instanceid }, orderby: { _created: -1 }, top: 1 });
            if (res.length > 0) { this.model = res[0]; } else {
                this.errormessage = this.id + " workflow instances not found!";
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
                console.error(this.errormessage);
                return;
            }
            if (this.model.payload === null || this.model.payload === undefined) {
                this.model.payload = { _id: this.instanceid };
            }
            if (typeof this.model.payload !== "object") {
                this.model.payload = { message: this.model.payload, _id: this.instanceid };
            }


            if (this.model.form === "none" || this.model.form === "") {
                if (this.model.state != "failed") {
                    this.$location.path("/main");
                } else {
                    this.hideFormElements();
                    if (this.model.state == "failed") {
                        if ((this.model as any).error != null && (this.model as any).error != "") {
                            this.errormessage = (this.model as any).error;
                        } else if (!this.model.payload) {
                            this.errormessage = "An unknown error occurred";
                        } else if (this.model.payload.message != null && this.model.payload.message != "") {
                            this.errormessage = this.model.payload.message;
                        } else if (this.model.payload.Message != null && this.model.payload.Message != "") {
                            this.errormessage = this.model.payload.Message;
                        } else {
                            this.errormessage = this.model.payload;
                        }
                    } else {
                        this.message = "Processing . . .";
                    }
                }
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
                return;
            } else if (this.model.form === "unknown") {
                this.Save();
                return;
            } else if (this.model.form !== "") {
                const res = await NoderedUtil.Query({ collectionname: "forms", query: { _id: this.model.form }, orderby: { _created: -1 }, top: 1 });
                if (res.length > 0) { this.form = res[0]; } else {
                    if (this.model.state == "completed") {
                        this.$location.path("/main");
                        if (!this.$scope.$$phase) { this.$scope.$apply(); }
                        return;
                    } else {
                        this.errormessage = this.model.form + " form not found! " + this.model.state;
                        if (!this.$scope.$$phase) { this.$scope.$apply(); }
                        console.error(this.errormessage);
                        return;
                    }
                }
            }
            this.renderform();
        } else {
            try {
                await this.SendOne(this.workflow.queue, {});
            } catch (error) {
                this.errormessage = error.message ? error.message : error;
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
                console.error(this.errormessage);

            }
        }
    }
    async SendOne(queuename: string, message: any): Promise<void> {
        let result: any = await NoderedUtil.Queue({ queuename, replyto: this.queuename, data: message, expiration: this.queue_message_timeout, striptoken: false });
        try {
            if (typeof result === "string" || result instanceof String) {
                result = JSON.parse((result as any));
            }
        } catch (error) {
            this.errormessage = error.message ? error.message : error;
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
            console.error(this.errormessage);
        }
    }
    async Save() {
        if (this.form !== null && this.form !== undefined && this.form.fbeditor === true) {
            const userData: any[] = this.formRender.userData;
            if (this.model.payload === null || this.model.payload === undefined) { this.model.payload = {}; }
            for (let i = 0; i < userData.length; i++) {
                this.model.payload[userData[i].name] = "";
                const val = userData[i].userData;
                if (val !== undefined && val !== null) {
                    if (userData[i].type == "checkbox-group") {
                        this.model.payload[userData[i].name] = val;
                    } else if (Array.isArray(val)) {
                        this.model.payload[userData[i].name] = val[0];
                    } else {
                        this.model.payload[userData[i].name] = val;
                    }
                }
            }
            this.model.payload.submitbutton = this.submitbutton;
            const ele = $('.render-wrap');
            ele.hide();
        } else {

        }
        this.model.payload._id = this.instanceid;
        try {
            await this.SendOne(this.workflow.queue, this.model.payload);
        } catch (error) {
            this.errormessage = error.message ? error.message : error;
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
            console.error(this.errormessage);
        }
    }
    traversecomponentsPostProcess(components: any[], data: any) {
        for (let i = 0; i < components.length; i++) {
            const item = components[i];
            if (item.type == "button" && item.action == "submit") {
                if (data[item.key] == true) {
                    this.submitbutton = item.key;
                    this.model.payload.submitbutton = item.key;
                }
            }
        }

        for (let i = 0; i < components.length; i++) {
            const item = components[i];
            if (item.type == "table") {
                for (let x = 0; x < item.rows.length; x++) {
                    for (let y = 0; y < item.rows[x].length; y++) {
                        const subcomponents = item.rows[x][y].components;
                        this.traversecomponentsPostProcess(subcomponents, data);
                    }

                }
            }
        }

    }
    traversecomponentsMakeDefaults(components: any[]) {
        if (!components) return;
        for (let y = 0; y < components.length; y++) {
            const item = components[y];
            if (item.type == "datagrid") {
                if (this.model.payload[item.key] === null || this.model.payload[item.key] === undefined) {
                    const obj: any = {};
                    for (let x = 0; x < item.components.length; x++) {
                        obj[item.components[x].key] = "";
                    }
                    this.model.payload[item.key] = [obj];
                } else {
                    if (Array.isArray(this.model.payload[item.key])) {
                    } else {
                        const keys = Object.keys(this.model.payload[item.key]);
                        const arr: any[] = [];
                        for (let x = 0; x < keys.length; x++) {
                            arr.push(this.model.payload[item.key][keys[x]]);
                        }
                        this.model.payload[item.key] = arr;
                    }
                }
            }
            if (item.type == "button" && item.action == "submit") {
                this.model.payload[item.key] = false;
            }
        }
        if (this.model.payload != null && this.model.payload != undefined) {
            if (this.model.payload.values != null && this.model.payload.values != undefined) {
                const keys = Object.keys(this.model.payload.values);
            }
        }
        if (this.model.payload != null && this.model.payload != undefined) {
            if (this.model.payload.values != null && this.model.payload.values != undefined) {
                const keys = Object.keys(this.model.payload.values);
                for (let i = 0; i < keys.length; i++) {
                    const values = this.model.payload.values[keys[i]];
                    for (let y = 0; y < components.length; y++) {
                        const item = components[y];
                        if (item.key == keys[i]) {
                            if (Array.isArray(values)) {
                                const obj2: any = {};
                                for (let x = 0; x < values.length; x++) {
                                    obj2[x] = values[x];
                                }
                                if (item.data != null && item.data != undefined) {
                                    item.data.values = obj2;
                                    item.data.json = JSON.stringify(values);
                                } else {
                                    item.values = values;
                                }
                            } else {
                                if (item.data != null && item.data != undefined) {
                                    item.data.values = values;
                                    item.data.json = JSON.stringify(values);
                                } else {
                                    item.values = values;
                                }
                            }
                        }
                    }

                }
            }
        }
        for (let i = 0; i < components.length; i++) {
            const item = components[i];
            if (item.type == "table") {
                for (let x = 0; x < item.rows.length; x++) {
                    for (let y = 0; y < item.rows[x].length; y++) {
                        const subcomponents = item.rows[x][y].components;
                        this.traversecomponentsMakeDefaults(subcomponents);
                    }

                }
            }
        }
    }
    traversecomponentsAddCustomValidate(components: any[]) {
        if (!components) return;
        for (let y = 0; y < components.length; y++) {
            const item = components[y];
            if (item.type == "file") {
                item.storage = "url";
                item.url = "/upload"
            }
        }
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async beforeSubmit(submission, next) {
        next();
    }
    async renderform() {

        if (this.form.fbeditor == null || this.form.fbeditor == undefined) this.form.fbeditor = true;
        if ((this.form.fbeditor as any) == "true") this.form.fbeditor = true;
        if ((this.form.fbeditor as any) == "false") this.form.fbeditor = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
        if (this.form.fbeditor === true) {
            const roles: any = {};
            WebSocketClient.instance.user.roles.forEach(role => {
                roles[role._id] = role.name;
            });
            if (typeof this.form.formData === 'string' || this.form.formData instanceof String) {
                this.form.formData = JSON.parse((this.form.formData as any));
            }
            for (let i = 0; i < this.form.formData.length; i++) {
                let value = this.model.payload[this.form.formData[i].name];
                if (value == undefined || value == null) { value = ""; }
                if (value != "" || this.form.formData[i].type != "button") {
                    this.form.formData[i].userData = [value];
                }
                if (Array.isArray(value)) {
                    this.form.formData[i].userData = value;
                }
                if (this.model.payload[this.form.formData[i].label] !== null && this.model.payload[this.form.formData[i].label] !== undefined) {
                    value = this.model.payload[this.form.formData[i].label];
                    if (value == undefined || value == null) { value = ""; }
                    if (this.form.formData[i].type != "button") {
                        this.form.formData[i].label = value;
                    } else if (value != "") {
                        this.form.formData[i].label = value;
                    } else {
                    }
                }
                if (this.model.values !== null && this.model.values !== undefined) {
                    if (this.model.values[this.form.formData[i].name] !== null && this.model.values[this.form.formData[i].name] !== undefined) {
                        value = this.model.values[this.form.formData[i].name];
                        if (value == undefined || value == null) { value = []; }
                        this.form.formData[i].values = value;
                    }
                }
            }
            const formRenderOpts = {
                formData: this.form.formData,
                dataType: this.form.dataType,
                roles: roles,
                disabledActionButtons: ['data', 'clear'],
                onSave: this.Save.bind(this),
            };
            if (this.model.userData !== null && this.model.userData !== undefined && this.model.userData !== "") {
                formRenderOpts.formData = this.model.userData;
            }
            const concatHashToString = function (hash) {
                let emptyStr = '';
                $.each(hash, function (index) {
                    emptyStr += ' ' + hash[index].name + '="' + hash[index].value + '"';
                });
                return emptyStr;
            }
            setTimeout(() => {
                $('button[type="button"]').each(function () {
                    const cur: any = $(this)[0];
                    cur.type = "submit";
                });
                const click = function (evt) {
                    this.submitbutton = evt.target.id;
                }
                $('button[type="submit"]').click(click.bind(this));

            }, 500);
            const ele: any = $('.render-wrap');
            ele.show();
            if (ele.formBuilder == null || ele.formBuilder == undefined) {
                await jsutil.loadScript("jquery-ui.min.js");
                await jsutil.loadScript("form-builder.min.js");
                await jsutil.loadScript("form-render.min.js");
            }
            this.formRender = ele.formRender(formRenderOpts);
        } else {
            if (!this.form.schema || !this.form.schema.components || this.form.schema.components.length == 0) {
                if (this.form.formData && this.form.formData.components && this.form.formData.components.length > 0) {
                    console.warn("schema has no components, but forData does, using form formData.components instead")
                    this.form.schema.components = this.form.formData.components;
                }
            }
            if (!this.form.schema || !this.form.schema.components || this.form.schema.components.length == 0) {
                console.error("Form has no schema ( components ) !", this.form)
            }
            try {
                const test = Formio.builder;
            } catch (error) {
                await jsutil.loadScript("formio.full.min.js");
            }
            try {
                const storage = "url";
                const Providers = Formio.Providers
                const p = Providers.getProviders('storage');
                Providers.providers['storage'] = { "url": ofurl.default };

                const Provider = Providers.getProvider('storage', storage);
                const provider = new Provider(this);
            } catch (error) {
                console.error(error);
            }

            this.traversecomponentsMakeDefaults(this.form.schema.components);
            this.traversecomponentsAddCustomValidate(this.form.schema.components);

            if (this.form.wizard == true) {
                this.form.schema.display = "wizard";
            } else {
                this.form.schema.display = "form";
            }
            let protocol = "http:";
            if (this.WebSocketClientService.wsurl.startsWith("wss")) protocol = "https:";
            Formio.setBaseUrl(protocol + '//' + this.WebSocketClientService.domain);
            Formio.setProjectUrl(protocol + '//' + this.WebSocketClientService.domain);

            this.formioRender = await Formio.createForm(document.getElementById('formio'), this.form.schema,
                {
                    breadcrumbSettings: { clickable: true },
                    buttonSettings: { showCancel: false },
                    hooks: {
                        beforeSubmit: this.beforeSubmit.bind(this),
                        customValidation: async (submission, next) => {
                            $(".alert-success").hide();
                            setTimeout(() => {
                                // just to be safe
                                $(".alert-success").hide();
                            }, 200);
                            this.model.submission = submission;
                            this.model.userData = submission;
                            this.model.payload = submission.data;
                            this.traversecomponentsPostProcess(this.form.schema.components, submission.data);
                            next();
                        }
                    }
                });
            this.formioRender.on('submit', async submission => {
                this.Save();
            });
            // wizard
            // https://formio.github.io/formio.js/app/examples/datagrid.html

            if (this.model.payload != null && this.model.payload != undefined) {
                this.formioRender.submission = { data: this.model.payload };
            }
            this.formioRender.on('error', (error) => {
                this.errormessage = error.message ? error.message : error;
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
                console.error(this.errormessage);
            });
        }
        if (this.model.state == "processing") {
            this.hideFormElements();
            this.message = "Processing . . .";
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
        }
        if (this.model.state == "completed" || this.model.state == "failed") {
            this.hideFormElements();
            if (this.model.state == "failed") {
                if ((this.model as any).error != null && (this.model as any).error != "") {
                    this.errormessage = (this.model as any).error;
                } else if (!this.model.payload) {
                    this.errormessage = "An unknown error occurred";
                } else if (this.model.payload.message != null && this.model.payload.message != "") {
                    this.errormessage = this.model.payload.message;
                } else if (this.model.payload.Message != null && this.model.payload.Message != "") {
                    this.errormessage = this.model.payload.Message;
                } else {
                    this.errormessage = this.model.payload;
                }
            }
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }

}
export class EntityCtrl extends entityCtrl<Base> {
    searchFilteredList: TokenUser[] = [];
    searchSelectedItem: TokenUser = null;
    searchtext: string = "";
    e: any = null;

    public newkey: string = "";
    public showjson: boolean = false;
    public jsonmodel: string = "";
    public message: string = "";
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $sce: ng.ISCEService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $sce, $interval, WebSocketClientService, api, userdata);
        console.debug("EntityCtrl");
        this.collection = $routeParams.collection;
        this.postloadData = this.processdata;
        WebSocketClientService.onSignedin(async (user: TokenUser) => {
            if (this.id !== null && this.id !== undefined) {
                await this.loadData();
            } else {
                this.model = new Base();
                this.model._type = "test";
                this.model.name = "new item";
                this.model._encrypt = [];
                this.keys = Object.keys(this.model);
                for (let i: number = this.keys.length - 1; i >= 0; i--) {
                    if (this.keys[i].startsWith('_')) this.keys.splice(i, 1);
                }
                this.searchSelectedItem = WebSocketClient.instance.user;
                this.adduser();
                this.processdata();
                //if (!this.$scope.$$phase) { this.$scope.$apply(); }
            }
        });
    }
    cached = {}
    getstep(key, obj) {
        if (this.gettype(obj) == "number") {
            if (obj.toString().indexOf(".") > -1) {
                var decimals = obj.toString().split(".")[1].length;
                this.cached[key] = 1 / Math.pow(10, decimals);
                return this.cached[key];
            } else {
                if (this.cached[key]) return this.cached[key];
            }
        }
        this.cached[key] = 1;
        return 1;
    }
    gettype(obj) {
        return typeof obj;
    }
    getinputtype(obj, key) {
        if (this.model._encrypt.indexOf(key))
            if (typeof obj === "string") return "text";
        if (typeof obj === "number") return "number";
        if (typeof obj === "boolean") return "checkbox";
    }
    processdata() {
        const ids: string[] = [];
        if (this.collection == "files" || this.collection?.endsWith(".files")) {
            for (let i: number = 0; i < (this.model as any).metadata._acl.length; i++) {
                ids.push((this.model as any).metadata._acl[i]._id);
            }
        } else {
            for (let i: number = 0; i < this.model._acl.length; i++) {
                ids.push(this.model._acl[i]._id);
            }
        }
        if (this.model._encrypt == null) { this.model._encrypt = []; }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
        this.fixtextarea();
    }
    isobject(object: any) {
        return typeof object === 'object';
    }
    fixtextarea() {
        setTimeout(() => {
            const tx = document.getElementsByTagName('textarea');
            for (let i = 0; i < tx.length; i++) {
                tx[i].setAttribute('style', 'height:' + (tx[i].scrollHeight) + 'px;overflow-y:hidden;');
            }
        }, 500);
    }
    togglejson() {
        this.showjson = !this.showjson;
        if (this.showjson) {
            this.jsonmodel = JSON.stringify(this.model, null, 2);
        } else {
            this.model = JSON.parse(this.jsonmodel);
            this.keys = Object.keys(this.model);
            for (let i: number = this.keys.length - 1; i >= 0; i--) {
                if (this.keys[i].startsWith('_')) this.keys.splice(i, 1);
            }
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
        this.fixtextarea();
    }
    async submit(): Promise<void> {
        if (this.showjson) {
            try {
                this.model = JSON.parse(this.jsonmodel);
            } catch (error) {
                this.message = error;
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
                return;
            }
        }
        try {
            // if (this.model._id) {
            if (this.id !== null && this.id !== undefined) {
                await NoderedUtil.UpdateOne({ collectionname: this.collection, item: this.model });
            } else {
                await NoderedUtil.InsertOne({ collectionname: this.collection, item: this.model });
            }
            if (this.collection == "files") {
                this.$location.path("/Files");
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
                return;
            }
            this.$location.path("/Entities/" + this.collection);
        } catch (error) {
            this.errormessage = error.message ? error.message : error;
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    removekey(key) {
        if (this.keys.indexOf(key) > -1) {
            this.keys.splice(this.keys.indexOf(key), 1);
        }
        delete this.model[key];
    }
    addkey() {
        if (this.newkey === '') { return; }
        if (this.keys.indexOf(this.newkey) > -1) {
            this.keys.splice(this.keys.indexOf(this.newkey), 1);
        }
        this.keys.push(this.newkey);
        this.model[this.newkey] = '';
        this.newkey = '';
    }
    removeuser(_id) {
        if (this.collection == "files" || this.collection?.endsWith(".files")) {
            for (let i = 0; i < (this.model as any).metadata._acl.length; i++) {
                if ((this.model as any).metadata._acl[i]._id == _id) {
                    (this.model as any).metadata._acl.splice(i, 1);
                }
            }
        } else {
            for (let i = 0; i < this.model._acl.length; i++) {
                if (this.model._acl[i]._id == _id) {
                    this.model._acl.splice(i, 1);
                    //this.model._acl = this.model._acl.splice(index, 1);
                }
            }
        }

    }
    adduser() {
        const ace = new Ace();
        ace.deny = false;
        ace._id = this.searchSelectedItem._id;
        ace.name = this.searchSelectedItem.name;
        if (this.collection == "files" || this.collection?.endsWith(".files")) {
            (this.model as any).metadata._acl.push(ace);
        } else {
            this.model._acl.push(ace);
        }
        console.log("adduser", JSON.parse(JSON.stringify(this.model)));
        this.searchSelectedItem = null;
        this.searchtext = "";
    }
    isBitSet(item: Ace, bit: number): boolean {
        return Ace.isBitSet(item, bit);
    }
    setBit(item: Ace, bit: number): void {
        Ace.setBit(item, bit);
    }
    unsetBit(item: Ace, bit: number): void {
        Ace.unsetBit(item, bit);
    }
    toogleBit(a: Ace, bit: number) {
        if (this.isBitSet(a, bit)) {
            this.unsetBit(a, bit);
        } else {
            this.setBit(a, bit);
        }
    }
    restrictInput(e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            return false;
        }
    }
    setkey(e) {
        this.e = e;
        this.handlekeys();
    }
    handlekeys() {
        if (this.searchFilteredList.length > 0) {
            let idx: number = -1;
            for (let i = 0; i < this.searchFilteredList.length; i++) {
                if (this.searchSelectedItem != null) {
                    if (this.searchFilteredList[i]._id == this.searchSelectedItem._id) {
                        idx = i;
                    }
                }
            }
            if (this.e.keyCode == 38) { // up
                if (idx <= 0) {
                    idx = 0;
                } else { idx--; }
                this.searchSelectedItem = this.searchFilteredList[idx];
                return;
            }
            else if (this.e.keyCode == 40) { // down
                if (idx >= this.searchFilteredList.length) {
                    idx = this.searchFilteredList.length - 1;
                } else { idx++; }
                this.searchSelectedItem = this.searchFilteredList[idx];
                return;
            }
            else if (this.e.keyCode == 13) { // enter
                if (idx >= 0) {
                    this.searchtext = this.searchFilteredList[idx].name;
                    this.searchSelectedItem = this.searchFilteredList[idx];
                    this.searchFilteredList = [];
                    if (!this.$scope.$$phase) { this.$scope.$apply(); }
                }
                return;
            } else if (this.e.keyCode == 27) { // esc
                this.searchtext = "";
                this.searchFilteredList = [];
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
            }
        } else {
            if (this.e.keyCode == 13 && this.searchSelectedItem != null) {
                this.adduser();
            }
        }
    }
    async handlefilter(e) {
        this.e = e;
        let ids: string[];
        if (this.collection == "files" || this.collection?.endsWith(".files")) {
            ids = (this.model as any).metadata._acl.map(item => item._id);
        } else {
            ids = this.model._acl.map(item => item._id);
        }
        this.searchFilteredList = await NoderedUtil.Query({
            collectionname: "users",
            query: {
                $and: [
                    { $or: [{ _type: "user" }, { _type: "role" }] },
                    { name: this.searchtext }
                ]
            }
            , orderby: { _type: -1, name: 1 }, top: 2
        });

        this.searchFilteredList = this.searchFilteredList.concat(await NoderedUtil.Query({
            collectionname: "users",
            query: {
                $and: [
                    { $or: [{ _type: "user" }, { _type: "role" }] },
                    {
                        $or: [
                            { name: new RegExp([this.searchtext].join(""), "i") },
                            { email: new RegExp([this.searchtext].join(""), "i") },
                            { username: new RegExp([this.searchtext].join(""), "i") }
                        ]
                    },
                    { _id: { $nin: ids } }
                ]
            }
            , orderby: { _type: -1, name: 1 }, top: 5
        }));
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    fillTextbox(searchtext) {
        this.searchFilteredList.forEach((item: any) => {
            if (item.name.toLowerCase() == searchtext.toLowerCase()) {
                this.searchtext = item.name;
                this.searchSelectedItem = item;
                this.searchFilteredList = [];
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
            }
        });
    }

}
export class HistoryCtrl extends entitiesCtrl<Base> {
    public id: string = "";
    public model: Base;
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $interval, WebSocketClientService, api, userdata);
        this.autorefresh = true;
        console.debug("HistoryCtrl");
        this.id = $routeParams.id;
        this.basequery = { _id: this.id };
        this.collection = $routeParams.collection;
        this.baseprojection = null;
        this.postloadData = this.ProcessData;
        WebSocketClientService.onSignedin(async (user: TokenUser) => {
            await jsutil.ensureJQuery();
            this.loadData();
        });
    }
    public isNew: boolean = false;
    async ProcessData() {
        this.model = {} as any;
        if (this.models.length > 0) { this.model = this.models[0]; } else { this.isNew = true; }

        const keys = Object.keys(this.model);
        keys.forEach(key => {
            if (key.startsWith("_")) {
                delete this.model[key];
            }
        });
        this.models = await NoderedUtil.Query({
            collectionname: this.collection + "_hist", query: { id: this.id },
            projection: { name: 1, _createdby: 1, _modified: 1, _deleted: 1, _deletedby: 1, _version: 1, _type: 1 }, orderby: this.orderby
        });
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    ToggleModal() {
        var modal = document.getElementById("exampleModal");
        modal.classList.toggle("show");
    }
    async CompareNow(model) {
        this.ToggleModal();
        if (model.item == null) {
            const item = await NoderedUtil.GetDocumentVersion({ collectionname: this.collection, id: this.id, version: model._version });
            if (item != null) model.item = item;
        }
        if (model.item == null) {
            document.getElementById('visual').innerHTML = "Failed loading item version " + model._version;
        }
        let encrypt = model.item._encrypt;
        if (NoderedUtil.IsNullUndefinded(encrypt)) encrypt = [];
        let keys = Object.keys(model.item);
        keys.forEach(key => {
            if (key.startsWith("_")) {
                delete model.item[key];
            }
        });
        const delta = jsondiffpatch.diff(model.item, this.model);
        if (delta) {
            keys = Object.keys(delta);
            keys.forEach(key => {
                if (key.startsWith("$$")) {
                    delete delta[key];
                } else if (encrypt.indexOf(key) > -1) {
                    delta[key][0] = "******";
                    delta[key][1] = "******";
                }
            });
        }
        document.getElementById('visual').innerHTML = jsondiffpatch.formatters.html.format(delta, this.model);
    }
    async ShowVersion(model) {
        this.ToggleModal();
        if (model.item == null) {
            const item = await NoderedUtil.GetDocumentVersion({ collectionname: this.collection, id: this.id, version: model._version });
            if (item != null) model.item = item;
        }
        if (model.item == null) {
            document.getElementById('visual').innerHTML = "Failed loading item version " + model._version;
        }
        const keys = Object.keys(model.item);
        keys.forEach(key => {
            if (key.startsWith("_")) {
                delete model.item[key];
            }
        });
        const delta = jsondiffpatch.diff(model.item, { ...model.item, _id: this.id });
        document.getElementById('visual').innerHTML = jsondiffpatch.formatters.html.format(delta, model.item);
    }
    download(filename, text) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }
    async DownloadVersion(model, asXAML) {
        try {
            this.errormessage = "";
            if (model.item == null) {
                const item = await NoderedUtil.GetDocumentVersion({ collectionname: this.collection, id: this.id, version: model._version });
                if (item != null) model.item = item;
            }
            if (model.item == null) {
                this.errormessage = "Failed loading item version " + model._version;
                return;
            }
            if (asXAML == true) {
                var xaml = model.item.Xaml;
                if (NoderedUtil.IsNullEmpty(xaml)) xaml = "";
                this.download(model.item.Filename, xaml);
            } else {
                this.download(this.id + ".json", JSON.stringify(model.item, null, 2));
            }
        } catch (error) {
            this.errormessage = error;
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    async CompareThen(model) {
        try {
            if (model.delta == null) {
                const items = await NoderedUtil.Query({
                    collectionname: this.collection + "_hist", query: { _id: model._id },
                    orderby: this.orderby
                });
                if (items.length > 0) {
                    model.item = items[0].item;
                    model.delta = items[0].delta;
                }
            }
            this.ToggleModal();
            document.getElementById('visual').innerHTML = jsondiffpatch.formatters.html.format(model.delta, {});
        } catch (error) {
            this.errormessage = error;
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    async RevertTo(model) {
        try {
            if (model.item == null) {
                const item = await NoderedUtil.GetDocumentVersion({ collectionname: this.collection, id: this.id, version: model._version });
                if (item != null) model.item = item;
            }
            let result = window.confirm("Overwrite current version with version " + model._version + "?");
            if (result) {
                if (this.isNew) {
                    await NoderedUtil.InsertOne({ collectionname: this.collection, item: model.item });
                } else {
                    jsondiffpatch.patch(model.item, model.delta);
                    model.item._id = this.id;
                    await NoderedUtil.UpdateOne({ collectionname: this.collection, item: model.item });
                }
                this.loadData();
            }
        } catch (error) {
            this.errormessage = error;
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
}
export class hdrobotsCtrl extends entitiesCtrl<unattendedclient> {
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $interval, WebSocketClientService, api, userdata);
        this.autorefresh = true;
        console.debug("RolesCtrl");
        this.basequery = { _type: "unattendedclient" };
        this.collection = "openrpa";
        this.skipcustomerfilter = true;
        WebSocketClientService.onSignedin((user: TokenUser) => {
            this.loadData();
        });
    }
    async Enable(model: any): Promise<any> {
        this.loading = true;
        model.enabled = true;
        await NoderedUtil.UpdateOne({ collectionname: this.collection, item: model });
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    async Disable(model: any): Promise<any> {
        this.loading = true;
        model.enabled = false;
        await NoderedUtil.UpdateOne({ collectionname: this.collection, item: model });
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
}
export class ClientsCtrl  {
    public showinactive: boolean = false;
    public show: string = "all";
    public models: any[] = [];
    public orderby: any = {};
    public loading: boolean = false;
    public errormessage: string = "";
    public searchstring: string = "";
    public static $inject = [
        "$sce",
        "$rootScope",
        "$scope",
        "$timeout",
        "$location",
        "$routeParams",
        "$interval",
        "WebSocketClientService",
        "api",
        "userdata"
    ];
    constructor(
        public $sce: ng.ISCEService,
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $timeout: ng.ITimeoutService,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        console.debug("RobotsCtrl");
        this.$scope.$on('search', (event, data) => {
            this.searchstring = data;
            this.processdata();
        });

        WebSocketClientService.onSignedin((user: TokenUser) => {
            // this.loadData();
            this.processdata()
        });
    }
    async processdata() {
        var result = await NoderedUtil.CustomCommand({ "command": "getclients" });
        this.models = result as any;
        if (!this.userdata.data.ClientsCtrl) this.userdata.data.ClientsCtrl = {};
        this.userdata.data.ClientsCtrl.showinactive = this.showinactive;
        this.userdata.data.ClientsCtrl.show = this.show;

        if(this.searchstring != "") {
            this.models = this.models.filter(x => 
                x.name.toLowerCase().indexOf(this.searchstring.toLowerCase()) > -1
                || x.username.toLowerCase().indexOf(this.searchstring.toLowerCase()) > -1
                || x.user?.email?.toLowerCase().indexOf(this.searchstring.toLowerCase()) > -1
                );
        }


        if (this.orderby != null) {
            var keys = Object.keys(this.orderby);
            if (keys.length > 0) {
                var key = keys[0];
                var asc = this.orderby[key] == 1;
                this.models.sort((a, b) => {
                    if (a[key] < b[key]) return asc ? -1 : 1;
                    if (a[key] > b[key]) return asc ? 1 : -1;
                    return 0;
                });
            }
        }
        // if this.show is not empty, then order this.models by the field in this.show
        if (this.show != "all") {
            // @ts-ignore
            this.models = this.models.filter(x => x.agent == this.show);
        }
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    ShowWorkflows(model: any) {
        if (!this.userdata.data.RPAWorkflowsCtrl) this.userdata.data.RPAWorkflowsCtrl = {};
        this.userdata.data.RPAWorkflowsCtrl.basequeryas = model._id;
        this.userdata.data.basequeryas = model._id;
        this.$location.path("/RPAWorkflows");
        if (!this.$scope.$$phase) { this.$scope.$apply(); }

    }
    OpenNodered(model: any) {
        let name = model.username;
        name = name.toLowerCase();
        name = name.replace(/([^a-z0-9]+){1,63}/gi, "");
        const noderedurl = "//" + this.WebSocketClientService.agent_domain_schema.replace("$slug$", name);
        window.open(noderedurl);
    }
    ManageNodered(model: any) {
        this.$location.path("/Nodered/" + model._id);
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    async Impersonate(model: TokenUser): Promise<any> {
        try {
            this.loading = true;
            await this.WebSocketClientService.impersonate(model._id);
        } catch (error) {
            this.errormessage = JSON.stringify(error);
        }
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
}
export class AuditlogsCtrl extends entitiesCtrl<Role> {
    public model: Role;
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $interval, WebSocketClientService, api, userdata);
        this.autorefresh = false;
        this.baseprojection = null;
        // this.baseprojection = { name: 1, username: 1, type: 1, _type: 1, impostorname: 1, clientagent: 1, clientversion: 1, _created: 1, success: 1, remoteip: 1, metadata: 1 };
        this.searchfields = ["name", "impostorname", "clientagent", "type"];
        console.debug("AuditlogsCtrl");
        this.pagesize = 20;
        this.collection = "audit";
        this.postloadData = this.processdata;
        WebSocketClientService.onSignedin(async (user: TokenUser) => {
            user = TokenUser.From(user);
            // if (!user.HasRoleName("customer admins") && !user.HasRoleName("admins")) {
            if (!user.HasRoleName("admins")) {
                this.basequery = { "userid": user._id };
            }
            this.loadData();
        });
    }
    processdata() {
        for (let i = 0; i < this.models.length; i++) {
            const model: any = this.models[i];
            model.fa = "far fa-question-circle";
            model.fa2 = "";
            if (model.imagename != null && model.imagename != "") model.fa = 'fab fa-docker';
            if (model.clientagent == 'openrpa') model.fa = 'fas fa-robot';
            if (model.clientagent == 'webapp') model.fa = 'fas fa-globe';
            if (model.clientagent == 'browser') model.fa = 'fas fa-globe';
            if (model.clientagent == 'mobileapp') model.fa = 'fas fa-mobile-alt';
            if (model.clientagent == 'python') model.fa = 'fab python';
            if (model.clientagent == 'node') model.fa = 'fab fa-node-js';
            if (model.clientagent == 'nodeagent') model.fa = 'fab fa-node-js';
            if (model.clientagent == 'nodered') model.fa = 'fab fa-node-js';
            if (model.clientagent == 'getUserFromRequest') model.fa = 'fab fa-node-js';
            if (model.clientagent == 'googleverify') model.fa = 'fab fa-google';
            if (model.clientagent == 'samlverify') model.fa = 'fab fa-windows';
            if (model.clientagent == 'aiotwebapp') model.fa = 'fas fa-globe';
            if (model.clientagent == 'aiotmobileapp') model.fa = 'fas fa-mobile-alt';
            if (model.clientagent == 'nodered-cli') model.fa = 'fab fa-node-js';
            if (model.clientagent == 'openflow-cli') model.fa = 'fab fa-node-js';

            if (model.impostorname != '' && model.impostorname != null) model.fa2 = 'fas fa-user-secret';
        }
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    ToogleType(logtype) {
        if(logtype == null || logtype == "") {
            this.basequery = {}
        } else {
            this.basequery['type'] = logtype;
        }
        this.page = 0; 
        this.loading = false;
        this.loadData()
    }
    ToggleModal() {
        var modal = document.getElementById("exampleModal");
        modal.classList.toggle("show");
    }

    async ShowAudit(model: any): Promise<void> {
        this.model = null;
        var title = document.getElementById("title");
        title.scrollIntoView();
        this.ToggleModal();
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
        const arr = await NoderedUtil.Query({ collectionname: this.collection, query: { _id: model._id }, top: 1 });
        if (arr.length == 1) {
            this.model = arr[0];
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }

    }
}
declare const Stripe: any;
export class CredentialsCtrl extends entitiesCtrl<Base> {
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $interval, WebSocketClientService, api, userdata);
        this.autorefresh = true;
        console.debug("CredentialsCtrl");
        this.basequery = { _type: "credential" };
        this.collection = "openrpa";
        this.searchfields = ["name", "username"];
        this.postloadData = this.processData;
        if (this.userdata.data.CredentialsCtrl) {
            this.basequery = this.userdata.data.CredentialsCtrl.basequery;
            this.collection = this.userdata.data.CredentialsCtrl.collection;
            this.baseprojection = this.userdata.data.CredentialsCtrl.baseprojection;
            this.orderby = this.userdata.data.CredentialsCtrl.orderby;
            this.searchstring = this.userdata.data.CredentialsCtrl.searchstring;
            this.basequeryas = this.userdata.data.CredentialsCtrl.basequeryas;
        }

        WebSocketClientService.onSignedin((user: TokenUser) => {
            this.loadData();
        });
    }
    async processData(): Promise<void> {
        if (!this.userdata.data.CredentialsCtrl) this.userdata.data.CredentialsCtrl = {};
        this.userdata.data.CredentialsCtrl.basequery = this.basequery;
        this.userdata.data.CredentialsCtrl.collection = this.collection;
        this.userdata.data.CredentialsCtrl.baseprojection = this.baseprojection;
        this.userdata.data.CredentialsCtrl.orderby = this.orderby;
        this.userdata.data.CredentialsCtrl.searchstring = this.searchstring;
        this.userdata.data.CredentialsCtrl.basequeryas = this.basequeryas;
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    async DeleteOneUser(model: TokenUser): Promise<any> {
        this.loading = true;
        await NoderedUtil.DeleteOne({ collectionname: this.collection, id: model._id });
        this.models = this.models.filter(function (m: any): boolean { return m._id !== model._id; });
        this.loading = false;
        let name = model.username;
        name = name.split("@").join("").split(".").join("");
        name = name.toLowerCase();

        var query = { _type: "role", "$or": [{ name: name + "noderedadmins" }, { name: name + "nodered api users" }] }
        const list = await NoderedUtil.Query({ collectionname: "users", query, top: 4 });
        for (var i = 0; i < list.length; i++) {
            await NoderedUtil.DeleteOne({ collectionname: "users", id: list[i]._id });
        }

        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
}
export class CredentialCtrl extends entityCtrl<Base> {
    searchFilteredList: TokenUser[] = [];
    searchSelectedItem: TokenUser = null;
    searchtext: string = "";
    e: any = null;
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $sce: ng.ISCEService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $sce, $interval, WebSocketClientService, api, userdata);
        console.debug("CredentialCtrl");
        this.collection = "openrpa";
        WebSocketClientService.onSignedin(async (user: TokenUser) => {
            if (this.id !== null && this.id !== undefined) {
                await this.loadData();
            } else {
                this.model = new Base();
                this.model._type = "credential";
                this.model._encrypt = ["password"];
                this.searchSelectedItem = WebSocketClient.instance.user;
                this.adduser();
            }
        });
    }
    async submit(): Promise<void> {
        try {
            if (this.model._id) {
                await NoderedUtil.UpdateOne({ collectionname: this.collection, item: this.model });
            } else {
                await NoderedUtil.InsertOne({ collectionname: this.collection, item: this.model });
            }
            this.$location.path("/Credentials");
        } catch (error) {
            this.errormessage = error.message ? error.message : error;
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }




    removeuser(_id) {
        for (let i = 0; i < this.model._acl.length; i++) {
            if (this.model._acl[i]._id == _id) {
                this.model._acl.splice(i, 1);
                //this.model._acl = this.model._acl.splice(index, 1);
            }
        }
    }
    adduser() {
        const ace = new Ace();
        ace.deny = false;
        ace._id = this.searchSelectedItem._id;
        ace.name = this.searchSelectedItem.name;
        if (WebSocketClient.instance.user._id != ace._id) {
            Ace.resetnone(ace);
            this.setBit(ace, 2);
        }
        this.model._acl.push(ace);
        this.searchSelectedItem = null;
        this.searchtext = "";
    }
    isBitSet(item: Ace, bit: number): boolean {
        return Ace.isBitSet(item, bit);
    }
    setBit(item: Ace, bit: number): void {
        Ace.setBit(item, bit);
    }
    unsetBit(item: Ace, bit: number): void {
        Ace.unsetBit(item, bit);
    }
    toogleBit(a: Ace, bit: number) {
        if (this.isBitSet(a, bit)) {
            this.unsetBit(a, bit);
        } else {
            this.setBit(a, bit);
        }
    }
    restrictInput(e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            return false;
        }
    }
    setkey(e) {
        this.e = e;
        this.handlekeys();
    }
    handlekeys() {
        if (this.searchFilteredList.length > 0) {
            let idx: number = -1;
            for (let i = 0; i < this.searchFilteredList.length; i++) {
                if (this.searchSelectedItem != null) {
                    if (this.searchFilteredList[i]._id == this.searchSelectedItem._id) {
                        idx = i;
                    }
                }
            }
            if (this.e.keyCode == 38) { // up
                if (idx <= 0) {
                    idx = 0;
                } else { idx--; }
                this.searchSelectedItem = this.searchFilteredList[idx];
                return;
            }
            else if (this.e.keyCode == 40) { // down
                if (idx >= this.searchFilteredList.length) {
                    idx = this.searchFilteredList.length - 1;
                } else { idx++; }
                this.searchSelectedItem = this.searchFilteredList[idx];
                return;
            }
            else if (this.e.keyCode == 13) { // enter
                if (idx >= 0) {
                    this.searchtext = this.searchFilteredList[idx].name;
                    this.searchSelectedItem = this.searchFilteredList[idx];
                    this.searchFilteredList = [];
                    if (!this.$scope.$$phase) { this.$scope.$apply(); }
                }
                return;
            } else if (this.e.keyCode == 27) { // esc
                this.searchtext = "";
                this.searchFilteredList = [];
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
            }
        } else {
            if (this.e.keyCode == 13 && this.searchSelectedItem != null) {
                this.adduser();
            }
        }
    }
    async handlefilter(e) {
        this.e = e;
        let ids: string[];
        ids = this.model._acl.map(item => item._id);
        this.searchFilteredList = await NoderedUtil.Query({
            collectionname: "users",
            query: {
                $and: [
                    { $or: [{ _type: "user" }, { _type: "role" }] },
                    { name: this.searchtext }
                ]
            }
            , orderby: { _type: -1, name: 1 }, top: 2
        });
        this.searchFilteredList = this.searchFilteredList.concat(await NoderedUtil.Query({
            collectionname: "users",
            query: {
                $and: [
                    { $or: [{ _type: "user" }, { _type: "role" }] },
                    {
                        $or: [
                            { name: new RegExp([this.searchtext].join(""), "i") },
                            { email: new RegExp([this.searchtext].join(""), "i") },
                            { username: new RegExp([this.searchtext].join(""), "i") }
                        ]
                    },
                    { _id: { $nin: ids } }
                ]
            }
            , orderby: { _type: -1, name: 1 }, top: 5
        }));
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    fillTextbox(searchtext) {
        this.searchFilteredList.forEach((item: any) => {
            if (item.name.toLowerCase() == searchtext.toLowerCase()) {
                this.searchtext = item.name;
                this.searchSelectedItem = item;
                this.searchFilteredList = [];
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
            }
        });
    }

}


export class OAuthClientsCtrl extends entitiesCtrl<Base> {
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $interval, WebSocketClientService, api, userdata);
        this.autorefresh = true;
        console.debug("OAuthClientsCtrl");
        this.basequery = { _type: "oauthclient" };
        this.collection = "config";
        this.searchfields = ["name", "username"];
        this.postloadData = this.processData;
        this.skipcustomerfilter = true;
        if (this.userdata.data.OAuthClientsCtrl) {
            this.basequery = this.userdata.data.OAuthClientsCtrl.basequery;
            this.collection = this.userdata.data.OAuthClientsCtrl.collection;
            this.baseprojection = this.userdata.data.OAuthClientsCtrl.baseprojection;
            this.orderby = this.userdata.data.OAuthClientsCtrl.orderby;
            this.searchstring = this.userdata.data.OAuthClientsCtrl.searchstring;
            this.basequeryas = this.userdata.data.OAuthClientsCtrl.basequeryas;
        }

        WebSocketClientService.onSignedin((user: TokenUser) => {
            this.loadData();
        });
    }
    async processData(): Promise<void> {
        if (!this.userdata.data.OAuthClientsCtrl) this.userdata.data.OAuthClientsCtrl = {};
        this.userdata.data.OAuthClientsCtrl.basequery = this.basequery;
        this.userdata.data.OAuthClientsCtrl.collection = this.collection;
        this.userdata.data.OAuthClientsCtrl.baseprojection = this.baseprojection;
        this.userdata.data.OAuthClientsCtrl.orderby = this.orderby;
        this.userdata.data.OAuthClientsCtrl.searchstring = this.searchstring;
        this.userdata.data.OAuthClientsCtrl.basequeryas = this.basequeryas;
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
}
export class OAuthClientCtrl extends entityCtrl<Base> {
    searchFilteredList: TokenUser[] = [];
    searchSelectedItem: TokenUser = null;
    searchtext: string = "";
    e: any = null;
    public rolemappings: any;
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $sce: ng.ISCEService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $sce, $interval, WebSocketClientService, api, userdata);
        console.debug("OAuthClientCtrl");
        this.collection = "config";
        WebSocketClientService.onSignedin(async (user: TokenUser) => {
            if (this.id !== null && this.id !== undefined) {
                await this.loadData();
            } else {
                this.model = new Base();
                this.model._type = "oauthclient";
                this.model._encrypt = ["clientSecret"];
                (this.model as any).clientId = "application";
                (this.model as any).clientSecret = 'secret';
                (this.model as any).grants = ['password', 'refresh_token', 'authorization_code'];
                (this.model as any).redirectUris = [];
                (this.model as any).defaultrole = "Viewer";
                (this.model as any).rolemappings = { "admins": "Admin", "grafana editors": "Editor", "grafana admins": "Admin" };

                // (this.model as any).token_endpoint_auth_method = "none";
                (this.model as any).token_endpoint_auth_method = "client_secret_post";
                (this.model as any).response_types = ['code', 'id_token', 'code id_token'];
                (this.model as any).grant_types = ['implicit', 'authorization_code'];
                (this.model as any).post_logout_redirect_uris = [];
            }
        });
    }
    async submit(): Promise<void> {
        try {
            this.model["id"] = this.model["clientId"];
            if (this.model.name == null || this.model.name == "") this.model.name = this.model["id"];
            if (this.model._id) {
                await NoderedUtil.UpdateOne({ collectionname: this.collection, item: this.model });
            } else {
                await NoderedUtil.InsertOne({ collectionname: this.collection, item: this.model });
            }
            this.$location.path("/OAuthClients");
        } catch (error) {
            this.errormessage = error.message ? error.message : error;
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    deletefromarray(name: string, id: string) {
        if (id == null || id == "") return false;
        this.model[name] = this.model[name].filter(x => x != id);
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
        return true;
    }
    addtoarray(name: string, id: string) {
        if (id == null || id == "") return false;
        if (!Array.isArray(this.model[name])) this.model[name] = [];
        this.model[name] = this.model[name].filter(x => x != id);
        this.model[name].push(id);
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
        return true;
    }
    addrolemapping(name: string, value: string) {
        if (name == null || name == "") return false;
        if (value == null || value == "") return false;
        if (!this.model["rolemappings"]) this.model["rolemappings"] = {};
        this.model["rolemappings"][name] = value;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    deleterolemapping(name) {
        if (name == null || name == "") return false;
        if (!this.model["rolemappings"]) this.model["rolemappings"] = {};
        delete this.model["rolemappings"][name];
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    CopySecret(field) {
        /* Get the text field */
        var copyText = document.querySelector(field);
        copyText.type = "text";
        // var copythis = copyText.value;
        // copyText = document.getElementById('just_for_copy');
        // copyText.value = copythis;

        /* Select the text field */
        copyText.select();
        copyText.setSelectionRange(0, 99999); /*For mobile devices*/

        /* Copy the text inside the text field */
        document.execCommand("copy");
        /* Alert the copied text */
        // alert("Copied the text: " + copyText.value);
        copyText.type = "password";
    }

}

export class DuplicatesCtrl extends entitiesCtrl<Base> {
    public collections: any;
    public model: Base;
    public uniqeness: string;
    public includeonecounnt: boolean = false;
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $interval, WebSocketClientService, api, userdata);
        console.debug("DuplicatesCtrl");
        this.autorefresh = true;
        this.basequery = {};
        this.collection = $routeParams.collection;
        // this.baseprojection = { _type: 1, type: 1, name: 1, _created: 1, _createdby: 1, _modified: 1 };
        this.pagesize = 1;
        this.postloadData = this.processdata;
        const checkList = document.getElementById('list1');
        (checkList.getElementsByClassName('anchor')[0] as any).onclick = function (evt) {
            if (checkList.classList.contains('visible'))
                checkList.classList.remove('visible');
            else
                checkList.classList.add('visible');
        }
        if (this.userdata.data.DuplicatesCtrl) {
            this.basequery = this.userdata.data.DuplicatesCtrl.basequery;
            this.uniqeness = this.userdata.data.DuplicatesCtrl.uniqeness;
            this.baseprojection = this.userdata.data.DuplicatesCtrl.baseprojection;
            this.orderby = this.userdata.data.DuplicatesCtrl.orderby;
            this.searchstring = this.userdata.data.DuplicatesCtrl.searchstring;
            this.basequeryas = this.userdata.data.DuplicatesCtrl.basequeryas;
        } else {
            if (NoderedUtil.IsNullEmpty(this.collection)) {
                this.$location.path("/Duplicates/entities");
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
                return;
            }
        }
        if (this.orderby)
            if (NoderedUtil.IsNullEmpty(this.collection)) {
                this.$location.path("/Duplicates/entities");
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
                return;
            } else if (this.$location.path() != "/Duplicates/" + this.collection) {
                this.$location.path("/Duplicates/" + this.collection);
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
                return;
            }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
        WebSocketClientService.onSignedin(async (user: TokenUser) => {
            this.loadData();
        });
    }
    public keys: string[] = [];
    async processdata() {
        this.errormessage = "";
        if (this.models.length > 0) {
            this.keys = Object.keys(this.models[0]);
            for (let i: number = this.keys.length - 1; i >= 0; i--) {
                if(this.keys[i] == "metadata") {
                    this.keys.splice(i, 1);
                    var subkeys = Object.keys(this.models[0]["metadata"]);
                    for (let n: number = subkeys.length - 1; n >= 0; n--) {
                        if (!subkeys[n].startsWith('_') && subkeys[n] != "_type" && subkeys[n] != "$$hashKey") {
                            this.keys.push("metadata." + subkeys[n])
                        }
                    }                    
                } else if (this.keys[i].startsWith('_') && this.keys[i] != "_type" ) {
                    this.keys.splice(i, 1);
                } else if (this.keys[i] == "$$hashKey") {
                    this.keys.splice(i, 1);
                }
            }
            this.keys.sort();
            this.keys.reverse();
        } else { this.keys = []; }
        if (NoderedUtil.IsNullEmpty(this.uniqeness)) {
            this.uniqeness = "_type"
        }
        const aggregates: any[] = [];
        const arr = this.uniqeness.split(",");
        const group: any = { _id: {}, count: { "$sum": 1 } };
        group.items = {
            $push: { "_id": '$$ROOT._id', "name": '$$ROOT.name' }
        }
        arr.forEach(field => {
            if (field.trim() !== "") {
                group._id[field.split(".").join("_")] = "$" + field;
            }
        });
        if (!NoderedUtil.IsNullEmpty(this.searchstring)) {
            try {
                var json = JSON.parse(this.searchstring);
                aggregates.push({ "$match": json });
            } catch (error) {
                this.errormessage = error
                this.loading = false;
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
                return;
            }
        }
        aggregates.push({ "$group": group });
        if(this.includeonecounnt != true) {
            aggregates.push({ "$match": { "count": { "$gte": 2 } } });
        }
        aggregates.push({ "$limit": 100 });
        if (!NoderedUtil.IsNullUndefinded(this.orderby) && Object.keys(this.orderby).length > 0) aggregates.push({ "$sort": this.orderby })
        try {
            var queryas = this.basequeryas;
            if (this.WebSocketClientService.multi_tenant && !NoderedUtil.IsNullUndefinded(this.WebSocketClientService.customer) && !this.skipcustomerfilter) {
                queryas = this.WebSocketClientService.customer._id;
            }
            // @ts-ignore
            this.models = await NoderedUtil.Aggregate({ collectionname: this.collection, aggregates, queryas });
        } catch (error) {
            this.errormessage = JSON.stringify(error);
        }
        if (!this.userdata.data.DuplicatesCtrl) this.userdata.data.DuplicatesCtrl = {};
        this.userdata.data.DuplicatesCtrl.basequery = this.basequery;
        this.userdata.data.DuplicatesCtrl.uniqeness = this.uniqeness;
        this.userdata.data.DuplicatesCtrl.baseprojection = this.baseprojection;
        this.userdata.data.DuplicatesCtrl.orderby = this.orderby;
        this.userdata.data.DuplicatesCtrl.searchstring = this.searchstring;
        this.userdata.data.DuplicatesCtrl.basequeryas = this.basequeryas;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    ToggleUniqeness(model) {
        let arr = [];
        if (this.uniqeness != null && this.uniqeness != "") arr = this.uniqeness.split(',');
        const index = arr.indexOf(model);
        if (index > -1) {
            arr.splice(index, 1);
            this.uniqeness = arr.join(',');
        } else {
            arr.push(model);
            this.uniqeness = arr.join(',');
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
        this.loadData();
    }
    async ShowData(model) {
        this.ToggleModal();
        this.model = model;
    }
    async CloseModal() {
        this.ToggleModal();
    }
    ToggleModal() {
        var modal = document.getElementById("exampleModal");
        modal.classList.toggle("show");
    }
    OpenEntity(model) {
        this.ToggleModal()
        this.$location.path("/Entity/" + this.collection + "/" + model._id);
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
        return;

    }
    async MassDeleteOnlyOne() {
        this.loading = true;
        let ids: string[] = [];
        for (let x = 0; x < this.models.length; x++) {
            const item = (this.models[x] as any);
            ids.push(item.items[0]._id);
        }
        if (ids.length > 0) await NoderedUtil.DeleteMany({ collectionname: this.collection, ids });
        this.loading = false;
        this.loadData();
    }
    async MassDeleteAllButOne() {
        this.loading = true;
        let ids: string[] = [];
        for (let x = 0; x < this.models.length; x++) {
            const item = (this.models[x] as any);
            for (let y = 1; y < item.items.length; y++) {
                ids.push(item.items[y]._id);
            }
        }
        if (ids.length > 0) await NoderedUtil.DeleteMany({ collectionname: this.collection, ids });
        this.loading = false;
        this.loadData();
    }
    async MassDeleteAll() {
        this.loading = true;
        let ids: string[] = [];
        for (let x = 0; x < this.models.length; x++) {
            const item = (this.models[x] as any);
            for (let y = 0; y < item.items.length; y++) {
                ids.push(item.items[y]._id);
            }
        }
        if (ids.length > 0) await NoderedUtil.DeleteMany({ collectionname: this.collection, ids });
        this.loading = false;
        this.loadData();
    }
    async DeleteOnlyOne(model) {
        if (NoderedUtil.IsNullUndefinded(model)) return;
        if (NoderedUtil.IsNullUndefinded(model.items)) return;
        if (model.items.length < 2) return;
        this.loading = true;
        await NoderedUtil.DeleteOne({ collectionname: this.collection, id: model.items[0]._id });
        this.loading = false;
        this.loadData();
    }
    async DeleteAllButOne(model) {
        if (NoderedUtil.IsNullUndefinded(model)) return;
        if (NoderedUtil.IsNullUndefinded(model.items)) return;
        this.loading = true;
        let ids: string[] = [];
        for (let i = 1; i < model.items.length; i++) {
            ids.push(model.items[i]._id);
        }
        if (ids.length > 0) await NoderedUtil.DeleteMany({ collectionname: this.collection, ids });
        this.loading = false;
        this.loadData();
    }
    async DeleteAll(model) {
        if (NoderedUtil.IsNullUndefinded(model)) return;
        if (NoderedUtil.IsNullUndefinded(model.items)) return;
        this.loading = true;
        let ids: string[] = [];
        for (let i = 0; i < model.items.length; i++) {
            ids.push(model.items[i]._id);
        }
        if (ids.length > 0) await NoderedUtil.DeleteMany({ collectionname: this.collection, ids });
        this.loading = false;
        this.loadData();
    }
    async ModalDeleteOne(model) {
        this.loading = true;
        await NoderedUtil.DeleteOne({ collectionname: this.collection, id: model._id });
        let arr: any[] = (this.model as any).items;
        arr = arr.filter(x => x._id != model._id);
        (this.model as any).items = arr;
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
        this.loadData();
    }
}

export class DeletedCtrl extends entitiesCtrl<Base> {
    public collections: any;
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $interval, WebSocketClientService, api, userdata);
        console.debug("DeletedCtrl");
        this.autorefresh = true;
        this.basequery = {};
        this.collection = $routeParams.collection;
        this.baseprojection = { _type: 1, type: 1, name: 1, _created: 1, _createdby: 1, _modified: 1, _deleted: 1, _deletedby: 1 };
        this.orderby = { "_deleted": -1 }
        this.postloadData = this.processdata;
        if (this.userdata.data.DeletedCtrl) {
            this.basequery = this.userdata.data.DeletedCtrl.basequery;
            if (this.collection == null) this.collection = this.userdata.data.DeletedCtrl.collection;
            this.baseprojection = this.userdata.data.DeletedCtrl.baseprojection;
            this.orderby = this.userdata.data.DeletedCtrl.orderby;
            this.searchstring = this.userdata.data.DeletedCtrl.searchstring;
            this.basequeryas = this.userdata.data.DeletedCtrl.basequeryas;
        } else {
            if (NoderedUtil.IsNullEmpty(this.collection)) {
                this.$location.path("/Deleted/entities");
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
                return;
            }
        }
        if (NoderedUtil.IsNullEmpty(this.collection)) {
            this.$location.path("/Deleted/entities");
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
            return;
        } else if (this.$location.path() != "/Deleted/" + this.collection) {
            this.$location.path("/Deleted/" + this.collection);
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
            return;
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
        WebSocketClientService.onSignedin(async (user: TokenUser) => {
            this.loadData();
            this.collections = await NoderedUtil.ListCollections({});
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
        });
    }
    async loadData(): Promise<void> {
        this.loading = true;
        var query: any = { _deleted: { "$exists": true } };
        if ((this.searchstring as string).indexOf("{") == 0) {
            if ((this.searchstring as string).lastIndexOf("}") == ((this.searchstring as string).length - 1)) {
                try {
                    query = entitiesCtrl.parseJson(this.searchstring, null, null);
                    query["_deleted"] = { "$exists": true };
                } catch (error) {
                    this.errormessage = error.message ? error.message : error;
                }
            }
        } else {
            const finalor = [];
            for (let i = 0; i < this.searchfields.length; i++) {
                const newq: any = {};
                newq[this.searchfields[i]] = new RegExp(["^", this.searchstring, "$"].join(""), "i");
                newq[this.searchfields[i]] = new RegExp([this.searchstring].join(""), "i");
                finalor.push(newq);
            }
            if (Object.keys(query).length == 0) {
                query = { $or: finalor.concat() };
            } else {
                query = { $and: [query, { $or: finalor.concat() }] };
            }

        }
        if (this.page == 0) {
            this.models = await NoderedUtil.Query({
                collectionname: this.collection + "_hist",
                query, projection: { name: 1, _type: 1, _createdby: 1, _created: 1, _modified: 1, _deleted: 1, _deletedby: 1, _version: 1, id: 1 },
                orderby: this.orderby
            });
        } else {
            var temp = await NoderedUtil.Query({
                collectionname: this.collection + "_hist",
                query, projection: { name: 1, _type: 1, _createdby: 1, _created: 1, _modified: 1, _deleted: 1, _deletedby: 1, _version: 1, id: 1, skip: this.pagesize * this.page },
                orderby: this.orderby
            });
            this.models = this.models.concat(temp);
        }
        this.loading = false;
        this.processdata();
    }
    processdata() {
        if (!this.userdata.data.DeletedCtrl) this.userdata.data.DeletedCtrl = {};
        this.userdata.data.DeletedCtrl.basequery = this.basequery;
        this.userdata.data.DeletedCtrl.collection = this.collection;
        this.userdata.data.DeletedCtrl.baseprojection = this.baseprojection;
        this.userdata.data.DeletedCtrl.orderby = this.orderby;
        this.userdata.data.DeletedCtrl.searchstring = this.searchstring;
        this.userdata.data.DeletedCtrl.basequeryas = this.basequeryas;
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    SelectCollection() {
        this.userdata.data.DeletedCtrl.collection = this.collection;
        this.$location.path("/Deleted/" + this.collection);
        //this.$location.hash("#/Deleted/" + this.collection);
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
        // this.loadData();
    }
}

export class CustomersCtrl extends entitiesCtrl<Provider> {
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $interval, WebSocketClientService, api, userdata);
        console.debug("CustomersCtrl");
        this.basequery = { _type: "customer" };
        this.collection = "users";
        this.skipcustomerfilter = true;
        this.baseprojection = { _type: 1, type: 1, name: 1, _created: 1, _createdby: 1, _modified: 1, dbusage: 1 };
        this.postloadData = this.processData;
        if (this.userdata.data.CustomersCtrl) {
            this.basequery = this.userdata.data.CustomersCtrl.basequery;
            this.collection = this.userdata.data.CustomersCtrl.collection;
            this.baseprojection = this.userdata.data.CustomersCtrl.baseprojection;
            this.orderby = this.userdata.data.CustomersCtrl.orderby;
            this.searchstring = this.userdata.data.CustomersCtrl.searchstring;
            this.basequeryas = this.userdata.data.CustomersCtrl.basequeryas;
        }
        WebSocketClientService.onSignedin((user: TokenUser) => {
            this.loadData();
        });
    }
    async processData(): Promise<void> {
        if (!this.userdata.data.CustomersCtrl) this.userdata.data.CustomersCtrl = {};
        this.userdata.data.CustomersCtrl.basequery = this.basequery;
        this.userdata.data.CustomersCtrl.collection = this.collection;
        this.userdata.data.CustomersCtrl.baseprojection = this.baseprojection;
        this.userdata.data.CustomersCtrl.orderby = this.orderby;
        this.userdata.data.CustomersCtrl.searchstring = this.searchstring;
        this.userdata.data.CustomersCtrl.basequeryas = this.basequeryas;
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
}
export class CustomerCtrl extends entityCtrl<Customer> {
    public stripe: any = null;
    public nextinvoice: stripe_invoice = null;
    public proration: boolean = false;
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $sce: ng.ISCEService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $sce, $interval, WebSocketClientService, api, userdata);
        console.debug("CustomerCtrl");
        this.collection = "users";
        this.postloadData = this.processdata;
        WebSocketClientService.onSignedin(async (user: TokenUser) => {
            this.loading = true;
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
            let haderror: boolean = false;
            if (!NoderedUtil.IsNullEmpty(this.WebSocketClientService.stripe_api_key)) {
                try {
                    this.stripe = Stripe(this.WebSocketClientService.stripe_api_key);
                } catch (error) {
                    haderror = true;
                }
                if (haderror) {
                    await jsutil.loadScript('//js.stripe.com/v3/');
                    this.stripe = Stripe(this.WebSocketClientService.stripe_api_key);
                }
            }
            if (this.id !== null && this.id !== undefined && this.id != "new") {
                this.loading = false;
                this.loadData();
                return;
            } else {
                user = TokenUser.assign(user);
                if (user.customerid != null && this.id != "new") {
                    this.id = user.customerid;
                    this.basequery = { _id: this.id };
                    this.loading = false;
                    this.loadData();
                    return;
                }
                if (!user.HasRoleName("resellers")) {
                    if (!NoderedUtil.IsNullEmpty(user.customerid)) {
                        var results = await NoderedUtil.Query({
                            collectionname: this.collection, query: { "_type": "customer", "_id": user.customerid },
                            top: 1
                        });
                        if (results.length > 0) {
                            this.model = results[0];
                        }
                    }

                }
                if (NoderedUtil.IsNullUndefinded(this.model)) {
                    this.model = {} as any;

                    if (this.model.name == null || this.model.name == "") this.model.name = WebSocketClient.instance.user.name;
                    this.model._type = "customer";
                    var results = await NoderedUtil.Query({ collectionname: this.collection, query: { "_type": "billing", "userid": user._id }, top: 1 });

                    if (results.length > 0) {
                        console.debug("Reuse billing id " + results[0]._id + " with stripeid " + results[0].stripeid);
                        this.model.name = results[0].name;
                        this.model.stripeid = results[0].stripeid;
                        this.model.vatnumber = results[0].vatnumber;
                        this.model.vattype = results[0].vattype;
                    } else {
                        var results = await NoderedUtil.Query({ collectionname: this.collection, query: { "_type": "user", "_id": WebSocketClient.instance.user._id }, top: 1 });
                        if (results.length > 0 && !NoderedUtil.IsNullEmpty((results[0] as any).company)) {
                            this.model.name = (results[0] as any).company;
                        }
                    }
                    this.model.email = (WebSocketClient.instance.user as any).username;
                    if ((WebSocketClient.instance.user as any).email) this.model.email = (WebSocketClient.instance.user as any).email;
                    if (this.model.email && this.model.email.indexOf("@") == -1) {
                        this.model.email = (WebSocketClient.instance.user as any).username + "@domain.com";
                    }
                }
                this.loading = false;

                if (!this.$scope.$$phase) { this.$scope.$apply(); }
            }
        });
    }
    async submit(): Promise<void> {
        try {
            this.loading = true;
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
            this.errormessage = "";
            if (!NoderedUtil.IsNullEmpty(this.newdomain)) this.adddomain();
            if (this.model._id) {
                await NoderedUtil.EnsureCustomer({ customer: this.model });
                this.$rootScope.$broadcast("menurefresh");
                this.loading = false;
                this.loadData();
            } else {
                const res = await NoderedUtil.EnsureCustomer({ customer: this.model });
                this.WebSocketClientService.loadToken();
                this.WebSocketClientService.customer = res.customer;
                this.loading = false;
                this.$rootScope.$broadcast("menurefresh");
                try {
                    this.$location.path("/" + res.customer._id);
                } catch (error) {
                    this.$location.path("/");
                }
            }
        } catch (error) {
            this.loading = false;
            this.errormessage = error.message ? error.message : error;
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    public Resources: Resource[];
    public Assigned: ResourceUsage[];
    public UserResources: Resource[];
    public UserAssigned: ResourceUsage[];
    public support: ResourceUsage[] = [];
    public domain: string = "";
    public licenses: ResourceUsage[] = [];
    public licensekey: string = "";
    public licensekeydecoded: string = "";
    async processdata() {
        try {
            if (this.model._type != "customer") {
                return;
            }
            this.loading = true;
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
            this.errormessage = "";
            if (this.model != null) {
                if (WebSocketClient.instance.user.selectedcustomerid != this.model._id) {
                    console.log("update selected customer to id #" + this.model._id)
                    WebSocketClient.instance.user.selectedcustomerid = this.model._id;
                    this.$rootScope.$broadcast("menurefresh");
                } else {
                    console.log("user already have selected customer id #" + this.model._id)
                }
            }
            if (this.$routeParams.action != null) {
                await NoderedUtil.EnsureCustomer({ customer: this.model });
            }
            this.Resources = await NoderedUtil.Query({ collectionname: "config", query: { "_type": "resource", "target": "customer", "allowdirectassign": true }, orderby: { _created: -1 } });
            this.Assigned = await NoderedUtil.Query({ collectionname: "config", query: { "_type": "resourceusage", "customerid": this.model._id, "userid": { "$exists": false } }, orderby: { _created: -1 } });
            for (var res of this.Resources) {
                res.products = res.products.filter(x => x.allowdirectassign == true);
                for (var prod of res.products) {
                    (prod as any).count = this.AssignCount(prod);
                    
                    if ((prod as any).count > 0) {
                        (res as any).newproduct = prod;
                        (prod as any).usedby = this.UsedbyCount(prod);
                    }
                    if (prod.customerassign == "metered" && res.name == 'Database Usage') {

                        let billabledbusage: number = this.model.dbusage - res.defaultmetadata.dbusage;
                        if (billabledbusage > 0) {
                            const billablecount = Math.ceil(billabledbusage / prod.metadata.dbusage);
                            (prod as any).packagecount = billablecount;
                        } else {
                            (prod as any).packagecount = 0;
                        }
                    }

                }
            }
            this.UserResources = await NoderedUtil.Query({ collectionname: "config", query: { "_type": "resource", "target": "user", "allowdirectassign": true }, orderby: { _created: -1 } });
            this.UserAssigned = await NoderedUtil.Query({ collectionname: "config", query: { "_type": "resourceusage", "customerid": this.model._id, "userid": { "$exists": true } }, orderby: { _created: -1 } });
            for (var res of this.UserResources) {
                res.products = res.products.filter(x => x.allowdirectassign == true);
                for (var prod of res.products) {
                    (prod as any).count = this.UserAssignCount(prod);
                    if ((prod as any).count > 0) {
                        (res as any).newproduct = prod;
                    }
                }
            }
            this.support = [];
            this.licenses = [];
            for (let a of this.Assigned) {
                if (a.product.metadata.supportplan && a.siid != null) {
                    this.support.push(a);
                }
                if ( a.product.name == "Premium License" && a.siid != null) {
                    this.licenses.push(a);
                }
            }
            
        } catch (error) {
            this.errormessage = error;
        }
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    ToggleNextInvoiceModal() {
        var modal = document.getElementById("NextInvoiceModal");
        modal.classList.toggle("show");
    }
    CloseNextInvoiceModal() {
        var modal = document.getElementById("NextInvoiceModal");
        modal.classList.remove("show");
    }
    public period_start: string;
    public period_end: string;

    ShowPlans() {
        if (this.WebSocketClientService.customer == null) return false;
        if (!this.WebSocketClientService.multi_tenant) return false;
        // if (!NoderedUtil.IsNullEmpty(this.WebSocketClientService.stripe_api_key)) {
        //     if (!NoderedUtil.IsNullEmpty(this.WebSocketClientService.customer.stripeid)) return true;
        //     return false;
        // } else {
        //     return true;
        // }
        return true;
    }
    async NextInvoice() {
        try {
            if (this.WebSocketClientService.customer == null) return false;
            if (!this.WebSocketClientService.multi_tenant) return false;
            this.proration = false;
            this.loading = true;
            this.nextinvoice = await NoderedUtil.GetNextInvoice({ customerid: this.WebSocketClientService.customer._id });

            if (this.nextinvoice != null) {
                const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                const period_start = new Date(this.nextinvoice.period_start * 1000);
                const period_end = new Date(this.nextinvoice.period_end * 1000);
                this.period_start = period_start.getDate() + " " + monthNames[period_start.getMonth()] + " " + period_start.getFullYear();
                this.period_end = period_end.getDate() + " " + monthNames[period_end.getMonth()] + " " + period_end.getFullYear();
            }

            this.ToggleNextInvoiceModal();
            this.loading = false;
        } catch (error) {
            console.debug(error);
            this.loading = false;
            this.errormessage = error.message ? error.message : error;
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
            try {
                // await NoderedUtil.EnsureCustomer({ customer: this.model });
                // this.loadData();
            } catch (error) {
            }
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    AssignCount(Product: ResourceVariant) {
        const assigned = this.Assigned.filter(x => x.product.stripeprice == Product.stripeprice && x.quantity > 0 && x.siid != null);
        let quantity: number = 0;
        assigned.forEach(x => {
            quantity += x.quantity;
        });
        return quantity;
    }
    UsedbyCount(Product: ResourceVariant) {
        const assigned = this.Assigned.filter(x => x.product.stripeprice == Product.stripeprice && x.quantity > 0 && x.siid != null);
        let quantity: number = 0;
        assigned.forEach(x => {
            // @ts-ignore
            if (assigned[0].usedby == null) return 0;
            // @ts-ignore
            quantity = quantity + assigned[0].usedby.length;
        });
        return quantity;
    }
    UserAssignCount(Product: ResourceVariant) {
        const assigned = this.UserAssigned.filter(x => x.product.stripeprice == Product.stripeprice && x.quantity > 0 && x.siid != null);
        let quantity: number = 0;
        assigned.forEach(x => {
            quantity += x.quantity;
        });
        return quantity;
    }

    async RemovePlan(resource: Resource, product: ResourceVariant) {
        try {
            this.loading = true;
            this.CloseNextInvoiceModal();
            this.errormessage = "";
            const assigned = this.Assigned.filter(x => x.product.stripeprice == product.stripeprice);
            if (assigned.length > 0) {
                await NoderedUtil.StripeCancelPlan({ resourceusageid: assigned[0]._id });
            }
            this.loading = false;
            this.loadData();

        } catch (error) {
            this.loading = false;
            this.errormessage = error;
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    async AddPlan2() {
        try {
            this.CloseNextInvoiceModal();
            if (this.WebSocketClientService.customer == null) return false;
            if (!this.WebSocketClientService.multi_tenant) return false;
            this.loading = true;
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
            var result = await NoderedUtil.StripeAddPlan({ customerid: this.WebSocketClientService.customer._id, resourceid: this.resource._id, stripeprice: this.product.stripeprice });
            var checkout = result.checkout;
            if (checkout) {
                this.stripe
                    .redirectToCheckout({
                        sessionId: checkout.id,
                    })
                    .then(function (event) {
                        if (event.complete) {
                            // enable payment button
                        } else if (event.error) {
                            console.error(event.error);
                            if (event.error && event.error.message) {
                                this.cardmessage = event.error.message;
                            } else {
                                this.cardmessage = event.error;
                            }
                            console.error(event.error);

                            // show validation to customer
                        } else {
                        }
                    }).catch((error) => {
                        console.error(error);
                        this.errormessage = error;
                    });
            } else {
                this.loading = false;
                this.loadData();
            }
        } catch (error) {
            this.loading = false;
            this.errormessage = error;
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    private resource: Resource;
    private product: ResourceVariant
    async AddPlan(resource: Resource, product: ResourceVariant) {
        try {
            if (this.WebSocketClientService.customer == null) return false;
            if (!this.WebSocketClientService.multi_tenant) return false;
            this.loading = true;
            this.errormessage = "";

            this.resource = resource;
            this.product = product;

            let items = [];
            items.push({ quantity: 1, price: product.stripeprice });

            try {
                // If customer is created in stripe and has a subscriptuon we can calculate new invoice
                // if not, just ignore the error and send them to tripe to see the price for current product.
                this.nextinvoice = await NoderedUtil.GetNextInvoice({ customerid: this.WebSocketClientService.customer._id, subscription_items: items });
            } catch (error) {
                this.loading = false;
                if (error != "Need customer to work with invoices_upcoming") {
                    this.errormessage = error;
                }
            }
            if (this.nextinvoice != null) {
                const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                const period_start = new Date(this.nextinvoice.period_start * 1000);
                const period_end = new Date(this.nextinvoice.period_end * 1000);
                this.period_start = period_start.getDate() + " " + monthNames[period_start.getMonth()] + " " + period_start.getFullYear();
                this.period_end = period_end.getDate() + " " + monthNames[period_end.getMonth()] + " " + period_end.getFullYear();

                this.proration = true;
                this.ToggleNextInvoiceModal();
                this.loading = false;
            } else {
                this.AddPlan2();
            }
        } catch (error) {
            this.loading = false;
            this.errormessage = error;
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    async IssueLicense(domain: string, months: string) {
        try {
            this.errormessage = "";
            this.loading = true;
            if (domain == null || domain == "") return;
            const payload: any = { "email": this.model.email, domain };
            if(months != null && months != "") {
                payload["months"] = months;
            }
            this.domain = domain;
            const res:string = await NoderedUtil.CustomCommand({ command: "issuelicense", data: payload });
            // @ts-ignore
            this.licensekey = res;
            this.licensekeydecoded = atob(res);
            this.loading = false;
            // this.loadData();
        } catch (error) {
            this.loading = false;
            console.error(error);
            this.errormessage = error;
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    async AddHours(support: ResourceUsage) {
        try {
            this.loading = true;
            if (support == null) return;
            const hours: number = parseInt(window.prompt("Number of hours", "1"));
            if (hours > 0) {
                const dt = parseInt((new Date().getTime() / 1000).toFixed(0))
                const payload: any = { "quantity": hours, "timestamp": dt };
                const res = await NoderedUtil.Stripe({ method: "POST", object: "usage_records", id: support.siid, payload });
            }
            this.loading = false;
            this.loadData();
        } catch (error) {
            this.loading = false;
            console.error(error);
            this.errormessage = error;
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }

    async OpenPortal() {
        try {
            var payload: stripe_base = {} as any;
            (payload as any).customer = this.model.stripeid;
            var session: any = await NoderedUtil.Stripe({ method: "POST", object: "billing_portal/sessions", payload });
            if (session && session.url) {
                window.open(session.url, '_blank');
                // window.location.href = session.url;
            } else {
                this.errormessage = "Failed getting portal session url";
            }
        } catch (error) {
            this.loading = false;
            console.error(error);
            this.errormessage = error;
            try {
                await NoderedUtil.EnsureCustomer({ customer: this.model });
                this.loadData();
            } catch (error) {

            }
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    CountryUpdate() {
        const eu: string[] = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT',
            'RO', 'SK', 'SI', 'ES', 'SE'];
        if (eu.indexOf(this.model.country) > -1) {
            this.model.vattype = "eu_vat";
            if (this.model.vatnumber == null || this.model.vatnumber == "") this.model.vatnumber = this.model.country;
        }
    }
    public newdomain: string = "";
    deletedomain(domain) {
        if ((this.model as any).domains === null || (this.model as any).domains === undefined) {
            (this.model as any).domains = [];
        }
        (this.model as any).domains = (this.model as any).domains.filter(function (m: any): boolean { return m !== domain; });
    }
    adddomain() {
        if ((this.model as any).domains === null || (this.model as any).domains === undefined) {
            (this.model as any).domains = [];
        }
        var v = this.newdomain;
        try {
            v = JSON.parse(v);
        } catch (error) {
        }
        (this.model as any).domains.push(v);
        this.newdomain = "";
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }

}



export class EntityRestrictionsCtrl extends entitiesCtrl<Base> {
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $interval, WebSocketClientService, api, userdata);
        console.debug("EntityRestrictionsCtrl");
        this.basequery = { _type: "restriction" };
        this.collection = "config";
        this.postloadData = this.processData;
        this.skipcustomerfilter = true;
        if (this.userdata.data.EntityRestrictionsCtrl) {
            this.basequery = this.userdata.data.EntityRestrictionsCtrl.basequery;
            this.collection = this.userdata.data.EntityRestrictionsCtrl.collection;
            this.baseprojection = this.userdata.data.EntityRestrictionsCtrl.baseprojection;
            this.orderby = this.userdata.data.EntityRestrictionsCtrl.orderby;
            this.searchstring = this.userdata.data.EntityRestrictionsCtrl.searchstring;
            this.basequeryas = this.userdata.data.EntityRestrictionsCtrl.basequeryas;
        }

        WebSocketClientService.onSignedin((user: TokenUser) => {
            this.loadData();
        });
    }
    async processData(): Promise<void> {
        if (!this.userdata.data.EntityRestrictionsCtrl) this.userdata.data.EntityRestrictionsCtrl = {};
        this.userdata.data.EntityRestrictionsCtrl.basequery = this.basequery;
        this.userdata.data.EntityRestrictionsCtrl.collection = this.collection;
        this.userdata.data.EntityRestrictionsCtrl.baseprojection = this.baseprojection;
        this.userdata.data.EntityRestrictionsCtrl.orderby = this.orderby;
        this.userdata.data.EntityRestrictionsCtrl.searchstring = this.searchstring;
        this.userdata.data.EntityRestrictionsCtrl.basequeryas = this.basequeryas;
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    async EnsureCommon() {
        try {
            await this.newRestriction("Add any", "entities", ["$."], false);

            await this.newRestriction("Create workitemqueue in mq", "mq", ["$.[?(@ && @._type == 'workitemqueue')]"], false);
            await this.newRestriction("Create workitem in workitems", "workitems", ["$.[?(@ && @._type == 'workitem')]"], false);
            await this.newRestriction("Create agent in agents", "agents", ["$.[?(@ && @._type == 'agent')]"], false);
            await this.newRestriction("Create packages in agents", "agents", ["$.[?(@ && @._type == 'package')]"], false);

            await this.newRestriction("Create queues", "mq", ["$.[?(@ && @._type == 'queue')]"], false);
            await this.newRestriction("Create exchanges", "mq", ["$.[?(@ && @._type == 'exchange')]"], false);
            await this.newRestriction("Create form", "forms", ["$.[?(@ && @._type == 'form')]"], false);
            await this.newRestriction("Create resource in forms", "forms", ["$.[?(@ && @._type == 'resource')]"], false);
            await this.newRestriction("Create workflow", "openrpa", ["$.[?(@ && @._type == 'workflow')]"], false);
            await this.newRestriction("Create project", "openrpa", ["$.[?(@ && @._type == 'project')]"], false);
            await this.newRestriction("Create detector", "openrpa", ["$.[?(@ && @._type == 'detector')]"], false);
            await this.newRestriction("Create credential", "openrpa", ["$.[?(@ && @._type == 'credential')]"], false);
            await this.newRestriction("Create unattendedserver", "openrpa", ["$.[?(@ && @._type == 'unattendedserver')]"], false);
            await this.newRestriction("Create unattendedclient", "openrpa", ["$.[?(@ && @._type == 'unattendedclient')]"], false);
            await this.newRestriction("Create workflowinstance", "openrpa_instances", ["$.[?(@ && @._type == 'workflowinstance')]"], false);
            await this.newRestriction("Create workflow", "workflow", ["$.[?(@ && @._type == 'workflow')]"], false);
            await this.newRestriction("Create setting", "nodered", ["$.[?(@ && @._type == 'setting')]"], false);
            await this.newRestriction("Create session", "nodered", ["$.[?(@ && @._type == 'session')]"], false);
            await this.newRestriction("Create npmrc", "nodered", ["$.[?(@ && @._type == 'npmrc')]"], false);
            await this.newRestriction("Create flow", "nodered", ["$.[?(@ && @._type == 'flow')]"], false);
            await this.newRestriction("Create credential", "nodered", ["$.[?(@ && @._type == 'credential')]"], false);
            await this.newRestriction("Create instance", "workflow_instances", ["$.[?(@ && @._type == 'instance')]"], false);
            await this.newRestriction("Create test or unknown", "test", ["$.[?(@ && (@._type == 'test' || @._type == 'unknown'))]"], false);

            await this.newRestriction("Create role", "users", ["$.[?(@ && @._type == 'role')]"], false);
            await this.newRestriction("Create user", "users", ["$.[?(@ && @._type == 'user')]"], true);

            this.loadData();
        } catch (error) {
            this.errormessage = error;
        }
    }
    async newRestriction(name: string, collection: string, paths: string[], customeradmins: boolean) {
        var results = await NoderedUtil.Query({ collectionname: this.collection, query: { "name": name, "collection": collection }, top: 1 });
        const model: Base = (results.length == 1 ? results[0] : {} as any);
        model.name = name;
        model._type = "restriction";
        model._acl = [];
        Base.addRight(model, "5a1702fa245d9013697656fb", "admins", [-1]);
        if (customeradmins) {
            Base.addRight(model, "5a1702fa245d9013697656fc", "customer admins", [1]);
        } else {
            Base.addRight(model, "5a17f157c4815318c8536c21", "users", [1]);
        }
        (model as any).copyperm = false;
        (model as any).collection = collection;
        (model as any).paths = paths;
        if (model._id) {
            await NoderedUtil.UpdateOne({ collectionname: this.collection, item: model });
        } else {
            await NoderedUtil.InsertOne({ collectionname: this.collection, item: model });
        }
    }
}
export class EntityRestrictionCtrl extends entityCtrl<Base> {
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $sce: ng.ISCEService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $sce, $interval, WebSocketClientService, api, userdata);
        console.debug("EntityRestrictionCtrl");
        this.collection = "config";
        WebSocketClientService.onSignedin((user: TokenUser) => {
            if (this.id !== null && this.id !== undefined) {
                this.loadData();
            } else {
                this.model = {} as any;
                this.model.name = "";
                this.model.name = "Create test in entities";
                this.model._type = "restriction";
                this.model._acl = [];
                Base.addRight(this.model, "5a1702fa245d9013697656fb", "admins", [-1]);
                Base.addRight(this.model, "5a17f157c4815318c8536c21", "users", [1]);
                (this.model as any).copyperm = false;
                (this.model as any).collection = "entities";
                (this.model as any).paths = ["$.[?(@._type == 'test')]"];
            }
        });
    }
    deleteid(id) {
        if ((this.model as any).paths === null || (this.model as any).paths === undefined) {
            (this.model as any).paths = [];
        }
        this.newpath = id;
        (this.model as any).paths = (this.model as any).paths.filter(function (m: any): boolean { return m !== id; });
    }
    public newpath: string = "";
    addid() {
        if ((this.model as any).paths === null || (this.model as any).paths === undefined) {
            (this.model as any).paths = [];
        }
        if ((this.model as any).paths.indexOf(this.newpath) == -1) (this.model as any).paths.push(this.newpath);
        this.newpath = "";
    }
    async submit(): Promise<void> {
        if (this.newpath != "") this.addid();
        try {
            if (this.model._id) {
                await NoderedUtil.UpdateOne({ collectionname: this.collection, item: this.model });
            } else {
                await NoderedUtil.InsertOne({ collectionname: this.collection, item: this.model });
            }
            this.$location.path("/EntityRestrictions");
        } catch (error) {
            this.errormessage = error.message ? error.message : error;
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }



    removeuser(_id) {
        for (let i = 0; i < this.model._acl.length; i++) {
            if (this.model._acl[i]._id == _id) {
                this.model._acl.splice(i, 1);
                //this.model._acl = this.model._acl.splice(index, 1);
            }
        }
    }
    adduser() {
        const ace = new Ace();
        ace.deny = false;
        ace._id = this.searchSelectedItem._id;
        ace.name = this.searchSelectedItem.name;
        if (WebSocketClient.instance.user._id != ace._id) {
            Ace.resetnone(ace);
            this.setBit(ace, 1);
        }

        this.model._acl.push(ace);
        this.searchSelectedItem = null;
        this.searchtext = "";
    }
    isBitSet(item: Ace, bit: number): boolean {
        return Ace.isBitSet(item, bit);
    }
    setBit(item: Ace, bit: number): void {
        Ace.setBit(item, bit);
    }
    unsetBit(item: Ace, bit: number): void {
        Ace.unsetBit(item, bit);
    }
    toogleBit(a: Ace, bit: number) {
        if (this.isBitSet(a, bit)) {
            this.unsetBit(a, bit);
        } else {
            this.setBit(a, bit);
        }
    }
    searchFilteredList: Role[] = [];
    searchSelectedItem: Role = null;
    searchtext: string = "";
    e: any = null;
    restrictInput(e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            return false;
        }
    }
    setkey(e) {
        this.e = e;
        this.handlekeys();
    }
    handlekeys() {
        if (this.searchFilteredList.length > 0) {
            let idx: number = -1;
            for (let i = 0; i < this.searchFilteredList.length; i++) {
                if (this.searchSelectedItem != null) {
                    if (this.searchFilteredList[i]._id == this.searchSelectedItem._id) {
                        idx = i;
                    }
                }
            }
            if (this.e.keyCode == 38) { // up
                if (idx <= 0) {
                    idx = 0;
                } else { idx--; }
                this.searchSelectedItem = this.searchFilteredList[idx];
                return;
            }
            else if (this.e.keyCode == 40) { // down
                if (idx >= this.searchFilteredList.length) {
                    idx = this.searchFilteredList.length - 1;
                } else { idx++; }
                this.searchSelectedItem = this.searchFilteredList[idx];
                return;
            }
            else if (this.e.keyCode == 13) { // enter
                if (idx >= 0) {
                    this.searchtext = this.searchFilteredList[idx].name;
                    this.searchSelectedItem = this.searchFilteredList[idx];
                    this.searchFilteredList = [];
                    if (!this.$scope.$$phase) { this.$scope.$apply(); }
                }
                return;
            } else if (this.e.keyCode == 27) { // esc
                this.searchtext = "";
                this.searchFilteredList = [];
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
            }
        } else {
            if (this.e.keyCode == 13 && this.searchSelectedItem != null) {
                this.adduser();
            }
        }
    }
    async handlefilter(e) {
        this.e = e;
        let ids: string[];
        ids = this.model._acl.map(item => item._id);
        this.searchFilteredList = await NoderedUtil.Query({
            collectionname: "users",
            query: {
                $and: [
                    { $or: [{ _type: "user" }, { _type: "role" }] },
                    { name: this.searchtext }
                ]
            }
            , orderby: { _type: -1, name: 1 }, top: 2
        });

        this.searchFilteredList = this.searchFilteredList.concat(await NoderedUtil.Query({
            collectionname: "users",
            query: {
                $and: [
                    { $or: [{ _type: "user" }, { _type: "role" }] },
                    {
                        $or: [
                            { name: new RegExp([this.searchtext].join(""), "i") },
                            { email: new RegExp([this.searchtext].join(""), "i") },
                            { username: new RegExp([this.searchtext].join(""), "i") }
                        ]
                    },
                    { _id: { $nin: ids } }
                ]
            }
            , orderby: { _type: -1, name: 1 }, top: 5
        }));
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    fillTextbox(searchtext) {
        this.searchFilteredList.forEach((item: any) => {
            if (item.name.toLowerCase() == searchtext.toLowerCase()) {
                this.searchtext = item.name;
                this.searchSelectedItem = item;
                this.searchFilteredList = [];
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
            }
        });
    }

}



export class ResourcesCtrl extends entitiesCtrl<Resource> {
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $interval, WebSocketClientService, api, userdata);
        console.debug("ResourcesCtrl");
        this.basequery = { _type: "resource" };
        this.collection = "config";
        this.postloadData = this.processData;
        this.skipcustomerfilter = true;
        if (this.userdata.data.ResourcesCtrl) {
            this.basequery = this.userdata.data.ResourcesCtrl.basequery;
            this.collection = this.userdata.data.ResourcesCtrl.collection;
            this.baseprojection = this.userdata.data.ResourcesCtrl.baseprojection;
            this.orderby = this.userdata.data.ResourcesCtrl.orderby;
            this.searchstring = this.userdata.data.ResourcesCtrl.searchstring;
            this.basequeryas = this.userdata.data.ResourcesCtrl.basequeryas;
        }

        WebSocketClientService.onSignedin((user: TokenUser) => {
            this.loadData();
        });
    }
    public Assigned: ResourceUsage[];
    async processData(): Promise<void> {
        if (!this.userdata.data.ResourcesCtrl) this.userdata.data.ResourcesCtrl = {};
        this.userdata.data.ResourcesCtrl.basequery = this.basequery;
        this.userdata.data.ResourcesCtrl.collection = this.collection;
        this.userdata.data.ResourcesCtrl.baseprojection = this.baseprojection;
        this.userdata.data.ResourcesCtrl.orderby = this.orderby;
        this.userdata.data.ResourcesCtrl.searchstring = this.searchstring;
        this.userdata.data.ResourcesCtrl.basequeryas = this.basequeryas;
        if (!this.WebSocketClientService.customer || NoderedUtil.IsNullEmpty(this.WebSocketClientService.customer._id)) {
            this.Assigned = await NoderedUtil.Query({ collectionname: "config", query: { "_type": "resourceusage" }, orderby: { _created: -1 } });
        } else {
            this.Assigned = await NoderedUtil.Query({ collectionname: "config", query: { "_type": "resourceusage", "customerid": this.WebSocketClientService.customer._id }, orderby: { _created: -1 } });
        }
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    AssignCount(resource: Resource) {
        if (!this.Assigned || this.Assigned.length == 0) return 0;
        const assigned = this.Assigned.filter(x => x.resourceid == resource._id && x.quantity > 0 && x.subid != null);
        return assigned.length;
    }
    async EnsureCommon() {
        this.loading = true;
        try {
            if (this.WebSocketClientService.stripe_api_key == "pk_test_DNS5WyEjThYBdjaTgwuyGeVV00KqiCvf99") {
                // const nodered: Resource = await this.newResource("Nodered Instance", "user", "singlevariant", "singlevariant", { "resources": { "limits": { "memory": "225Mi" } } },
                //     [
                //         this.newProduct("Basic", "prod_HEC6rB2wRUwviG", "plan_HECATxbGlff4Pv", "single", "single", null, null, 0, { "resources": { "limits": { "memory": "256Mi" }, "requests": { "memory": "256Mi" } } }, true, 0),
                //         this.newProduct("Plus", "prod_HEDSUIZLD7rfgh", "plan_HEDSUl6qdOE4ru", "single", "single", null, null, 0, { "resources": { "limits": { "memory": "512Mi" }, "requests": { "memory": "512Mi" } } }, true, 1),
                //         this.newProduct("Premium", "prod_HEDTI7YBbwEzVX", "plan_HEDTJQBGaVGnvl", "single", "single", null, null, 0, { "resources": { "limits": { "memory": "1Gi" }, "requests": { "memory": "1Gi" } } }, true, 2),
                //         this.newProduct("Premium+", "prod_IERLqCwV7BV8zy", "price_1HdySLC2vUMc6gvh3H1pgG7A", "single", "single", null, null, 0, { "resources": { "limits": { "memory": "2Gi" }, "requests": { "memory": "2Gi" } } }, true, 3),
                //     ], true, true, 0);
                const nodered: Resource = await this.newResource("Agent Instance", "customer", "multiplevariants", "singlevariant", { "runtime_hours": 8, "agentcount": 1, "resources": { "limits": { "memory": "225Mi" } } },
                    [
                        this.newProduct("Basic (256Mi ram)", "prod_HEC6rB2wRUwviG", "plan_HECATxbGlff4Pv", "multiple", "single", null, null, 0, { "resources": { "limits": { "memory": "256Mi" }, "requests": { "memory": "256Mi" } } }, true, 0),
                        this.newProduct("Plus (512Mi ram)", "prod_HEDSUIZLD7rfgh", "plan_HEDSUl6qdOE4ru", "multiple", "single", null, null, 0, { "resources": { "limits": { "memory": "512Mi" }, "requests": { "memory": "512Mi" } } }, true, 1),
                        this.newProduct("Premium (1Gi ram)", "prod_HEDTI7YBbwEzVX", "plan_HEDTJQBGaVGnvl", "multiple", "single", null, null, 0, { "resources": { "limits": { "memory": "1Gi" }, "requests": { "memory": "1Gi" } } }, true, 2),
                        this.newProduct("Premium+ (2Gi ram)+", "prod_IERLqCwV7BV8zy", "price_1HdySLC2vUMc6gvh3H1pgG7A", "multiple", "single", null, null, 0, { "resources": { "limits": { "memory": "2Gi" }, "requests": { "memory": "2Gi" } } }, true, 3),
                    ], true, true, 0);
                const supporthours: Resource = await this.newResource("Support Hours", "customer", "multiplevariants", "multiplevariants", {},
                    [
                        this.newProduct("Premium Hours", "prod_HEZnir2GdKX5Jm", "plan_HEZp4Q4In2XcXe", "metered", "metered", null, null, 0, { "supportplan": true }, false, 1),
                        this.newProduct("Basic Hours", "prod_HEGjSQ9M6wiYiP", "plan_HEZAsA1DfkiQ6k", "metered", "metered", null, null, 0, { "supportplan": true }, false, 0),
                    ], false, true, 0);

                const support = await this.newResource("Support Agreement", "customer", "singlevariant", "singlevariant", {},
                    [
                        this.newProduct("Basic Support", "prod_HEGjSQ9M6wiYiP", "plan_HEGjLCtwsVbIx8", "single", "single", supporthours._id, "plan_HEZAsA1DfkiQ6k", 1, {}, true, 0),
                    ], true, true, 0);

                const premium: Resource = await this.newResource("Openflow License", "customer", "singlevariant", "singlevariant", {},
                    [
                        this.newProduct("Premium License", "prod_JcXS2AvXfwk1Lv", "price_1IzISoC2vUMc6gvhMtqTq2Ef", "multiple", "multiple", supporthours._id, "plan_HEZp4Q4In2XcXe", 1, {}, true, 0),
                    ], true, true, 2);

                const databaseusage: Resource = await this.newResource("Database Usage", "customer", "singlevariant", "singlevariant", { dbusage: (1048576 * 25) },
                    [
                        this.newProduct("50Mb quota", "prod_JccNQXT636UNhG", "price_1IzQBRC2vUMc6gvh3Er9QaO8", "multiple", "multiple", null, null, 0, { dbusage: (1048576 * 50) }, true, 1),
                        this.newProduct("Metered Monthly", "prod_JccNQXT636UNhG", "price_1IzNEZC2vUMc6gvhAWQbEBHm", "metered", "metered", null, null, 0, { dbusage: (1048576 * 50) }, true, 0),
                    ], true, true, 1);
            } if (this.WebSocketClientService.stripe_api_key == "pk_live_0XOJdv1fPLPnOnRn40CSdBsh009Ge1B2yI") {
                // const nodered: Resource = await this.newResource("Nodered Instance", "user", "singlevariant", "singlevariant", { "resources": { "limits": { "memory": "225Mi" } } },
                //     [
                //         this.newProduct("Basic Legacy", "prod_HIhT9WksWx9Fxv", "price_1HY8P0C2vUMc6gvhRJrLcLW0", "single", "single", null, null, 0, { "resources": { "limits": { "memory": "256Mi" }, "requests": { "memory": "256Mi" } } }, false, 0),
                //         this.newProduct("Basic", "prod_Jfg1JU7byqHYs9", "price_1J2KglC2vUMc6gvh3JGredpM", "single", "single", null, null, 0, { "resources": { "limits": { "memory": "256Mi" }, "requests": { "memory": "256Mi" } } }, true, 1),
                //         this.newProduct("Plus", "prod_Jfg1JU7byqHYs9", "price_1J2KhPC2vUMc6gvhIwTNUWAk", "single", "single", null, null, 0, { "resources": { "limits": { "memory": "512Mi" }, "requests": { "memory": "512Mi" } } }, true, 2),
                //         this.newProduct("Premium", "prod_Jfg1JU7byqHYs9", "price_1J2KhuC2vUMc6gvhRcs1mdUr", "single", "single", null, null, 0, { "resources": { "limits": { "memory": "1Gi" }, "requests": { "memory": "1Gi" } } }, true, 3),
                //         this.newProduct("Premium+", "prod_Jfg1JU7byqHYs9", "price_1J2KiFC2vUMc6gvhGy0scDB5", "single", "single", null, null, 0, { "resources": { "limits": { "memory": "2Gi" }, "requests": { "memory": "2Gi" } } }, true, 4),
                //     ], true, true, 0);
                const nodered: Resource = await this.newResource("Agent Instance", "customer", "multiplevariants", "singlevariant", { "runtime_hours": 8, "agentcount": 1, "resources": { "limits": { "memory": "225Mi" } } },
                    [
                        this.newProduct("Basic Legacy", "prod_HIhT9WksWx9Fxv", "price_1HY8P0C2vUMc6gvhRJrLcLW0", "multiple", "single", null, null, 0, { "resources": { "limits": { "memory": "256Mi" }, "requests": { "memory": "256Mi" } } }, false, 0),
                        this.newProduct("Basic (256Mi ram)", "prod_Jfg1JU7byqHYs9", "price_1J2KglC2vUMc6gvh3JGredpM", "multiple", "single", null, null, 0, { "resources": { "limits": { "memory": "256Mi" }, "requests": { "memory": "256Mi" } } }, true, 1),
                        this.newProduct("Plus (512Mi ram)", "prod_Jfg1JU7byqHYs9", "price_1J2KhPC2vUMc6gvhIwTNUWAk", "multiple", "single", null, null, 0, { "resources": { "limits": { "memory": "512Mi" }, "requests": { "memory": "512Mi" } } }, true, 2),
                        this.newProduct("Premium (1Gi ram)", "prod_Jfg1JU7byqHYs9", "price_1J2KhuC2vUMc6gvhRcs1mdUr", "multiple", "single", null, null, 0, { "resources": { "limits": { "memory": "1Gi" }, "requests": { "memory": "1Gi" } } }, true, 3),
                        this.newProduct("Premium+ (2Gi ram)", "prod_Jfg1JU7byqHYs9", "price_1J2KiFC2vUMc6gvhGy0scDB5", "multiple", "single", null, null, 0, { "resources": { "limits": { "memory": "2Gi" }, "requests": { "memory": "2Gi" } } }, true, 4),
                    ], true, true, 0);
                const supporthours: Resource = await this.newResource("Support Hours", "customer", "multiplevariants", "multiplevariants", {},
                    [
                        this.newProduct("Premium Hours", "prod_HFkZ8lKn7GtFQU", "plan_HFkbfsAs1Yvcly", "metered", "metered", null, null, 0, { "supportplan": true }, false, 1),
                        this.newProduct("Basic Hours", "prod_HG1vTqU4c7EaV5", "plan_HG1wBF6yq1O15C", "metered", "metered", null, null, 0, { "supportplan": true }, false, 0),
                    ], false, true, 0);

                const support = await this.newResource("Support Agreement", "customer", "singlevariant", "singlevariant", {},
                    [
                        this.newProduct("Basic Support", "prod_HG1vTqU4c7EaV5", "plan_HG1vb53VlOu46y", "single", "single", supporthours._id, "plan_HG1wBF6yq1O15C", 1, {}, true, 0),
                    ], true, true, 0);

                const premium: Resource = await this.newResource("Openflow License", "customer", "singlevariant", "singlevariant", {},
                    [
                        this.newProduct("Premium License", "prod_JcXS2AvXfwk1Lv", "price_1J2KcMC2vUMc6gvhmmsAGo35", "multiple", "multiple", supporthours._id, "plan_HFkbfsAs1Yvcly", 1, {}, true, 0),
                        this.newProduct("Premium License Legacy", "prod_HFkZ8lKn7GtFQU", "plan_HFka1sgovtAQ7k", "single", "single", supporthours._id, "plan_HFkbfsAs1Yvcly", 1, {}, false, 1),
                    ], true, true, 2);

                const databaseusage: Resource = await this.newResource("Database Usage", "customer", "singlevariant", "singlevariant", { dbusage: (1048576 * 25) },
                    [
                        this.newProduct("50Mb quota", "prod_JffpwKLldz2QWN", "price_1J2KWFC2vUMc6gvheg4kFzjI", "multiple", "multiple", null, null, 0, { dbusage: (1048576 * 50) }, true, 1),
                        this.newProduct("Metered Monthly", "prod_JffpwKLldz2QWN", "price_1Jkl6HC2vUMc6gvhXe4asJXW", "metered", "metered", null, null, 0, { dbusage: (1048576 * 50) }, true, 0),
                    ], true, true, 1);

                const poc = await this.newResource("Proff of Concept", "customer", "multiplevariants", "multiplevariants", {},
                    [
                        this.newProduct("POC adhoc Hours", "prod_Jgk2LqELt4QFwB", "price_1J3MZ3C2vUMc6gvhhWdgSqjW", "metered", "metered", "", "", 1, { "supportplan": true }, true, 0)
                    ], true, true, 3);
                poc.products.push(this.newProduct("POC Starter pack", "prod_Jgk2LqELt4QFwB", "price_1J3MZZC2vUMc6gvhh0sOq19z", "single", "single", poc._id, "price_1J3MZ3C2vUMc6gvhhWdgSqjW", 1, {}, true, 1));
                await NoderedUtil.UpdateOne({ collectionname: this.collection, item: poc });
            } else {
                // const nodered: Resource = await this.newResource("Nodered Instance", "user", "singlevariant", "singlevariant", { "resources": { "limits": { "memory": "225Mi" } } },
                //     [
                //         this.newProduct("Basic", "prod_HEC6rB2wRUwviG", "plan_HECATxbGlff4Pv", "single", "single", null, null, 0, { "resources": { "limits": { "memory": "256Mi" }, "requests": { "memory": "256Mi" } } }, true, 0),
                //         this.newProduct("Plus", "prod_HEDSUIZLD7rfgh", "plan_HEDSUl6qdOE4ru", "single", "single", null, null, 0, { "resources": { "limits": { "memory": "512Mi" }, "requests": { "memory": "512Mi" } } }, true, 1),
                //         this.newProduct("Premium", "prod_HEDTI7YBbwEzVX", "plan_HEDTJQBGaVGnvl", "single", "single", null, null, 0, { "resources": { "limits": { "memory": "1Gi" }, "requests": { "memory": "1Gi" } } }, true, 2),
                //         this.newProduct("Premium+", "prod_IERLqCwV7BV8zy", "price_1HdySLC2vUMc6gvh3H1pgG7A", "single", "single", null, null, 0, { "resources": { "limits": { "memory": "2Gi" }, "requests": { "memory": "2Gi" } } }, true, 3),
                //     ], true, true, 0);
                const nodered: Resource = await this.newResource("Agent Instance", "customer", "multiplevariants", "singlevariant", { "runtime_hours": 24, "agentcount": 1, "resources": { "limits": { "memory": "225Mi" } } },
                    [
                        this.newProduct("Basic (256Mi ram)", "prod_HEC6rB2wRUwviG", "plan_HECATxbGlff4Pv", "multiple", "single", null, null, 0, { "resources": { "limits": { "memory": "256Mi" }, "requests": { "memory": "256Mi" } } }, true, 0),
                        this.newProduct("Plus (512Mi ram)", "prod_HEDSUIZLD7rfgh", "plan_HEDSUl6qdOE4ru", "multiple", "single", null, null, 0, { "resources": { "limits": { "memory": "512Mi" }, "requests": { "memory": "512Mi" } } }, true, 1),
                        this.newProduct("Premium (1Gi ram)", "prod_HEDTI7YBbwEzVX", "plan_HEDTJQBGaVGnvl", "multiple", "single", null, null, 0, { "resources": { "limits": { "memory": "1Gi" }, "requests": { "memory": "1Gi" } } }, true, 2),
                        this.newProduct("Premium+ (2Gi ram)", "prod_IERLqCwV7BV8zy", "price_1HdySLC2vUMc6gvh3H1pgG7A", "multiple", "single", null, null, 0, { "resources": { "limits": { "memory": "2Gi" }, "requests": { "memory": "2Gi" } } }, true, 3),
                    ], true, true, 0);
                const databaseusage: Resource = await this.newResource("Database Usage", "customer", "singlevariant", "singlevariant", { dbusage: (1048576 * 25) },
                    [
                        this.newProduct("50Mb quota", "prod_JccNQXT636UNhG", "price_1IzQBRC2vUMc6gvh3Er9QaO8", "multiple", "multiple", null, null, 0, { dbusage: (1048576 * 50) }, true, 1),
                        this.newProduct("Metered Monthly", "prod_JccNQXT636UNhG", "price_1IzNEZC2vUMc6gvhAWQbEBHm", "metered", "metered", null, null, 0, { dbusage: (1048576 * 50) }, true, 0),
                    ], true, true, 1);

            }
            this.loading = false;
            this.loadData();
        } catch (error) {
            this.loading = false;
            this.errormessage = error;
        }
    }
    newProduct(name: string, stripeproduct: string, stripeprice: string, customerassign: "single" | "multiple" | "metered",
        userassign: "single" | "multiple" | "metered", added_resourceid: string, added_stripeprice: string, added_quantity_multiplier: number, metadata: any,
        allowdirectassign: boolean, order: number): ResourceVariant {
        const result: ResourceVariant = new ResourceVariant();
        result.name = name;
        result.stripeproduct = stripeproduct;
        result.stripeprice = stripeprice;
        result.customerassign = customerassign;
        result.userassign = userassign;
        result.added_resourceid = added_resourceid;
        result.added_stripeprice = added_stripeprice;
        result.added_quantity_multiplier = added_quantity_multiplier;
        result.metadata = metadata;
        result.allowdirectassign = allowdirectassign;
        (result as any).order = order;
        return result;
    }
    async newResource(name: string,
        target: "customer" | "user",
        customerassign: "singlevariant" | "multiplevariants",
        userassign: "singlevariant" | "multiplevariants",
        defaultmetadata: any,
        products: ResourceVariant[], allowdirectassign: boolean, customeradmins: boolean, order: number): Promise<Resource> {
        customeradmins = false;
        var results = await NoderedUtil.Query({ collectionname: this.collection, query: { "name": name }, top: 1 });
        const model: Resource = (results.length == 1 ? results[0] : new Resource());
        model.name = name;
        model.target = target;
        model.customerassign = customerassign;
        model.userassign = userassign;
        model.defaultmetadata = defaultmetadata;
        model.products = products;
        model.allowdirectassign = allowdirectassign;
        (model as any).order = order;
        model._acl = [];
        Base.addRight(model, "5a1702fa245d9013697656fb", "admins", [-1]);
        if (customeradmins) {
            Base.addRight(model, "5a1702fa245d9013697656fc", "customer admins", [2]);
        } else {
            Base.addRight(model, "5a17f157c4815318c8536c21", "users", [2]);
        }
        if (model._id) {
            return await NoderedUtil.UpdateOne({ collectionname: this.collection, item: model });
        } else {
            return await NoderedUtil.InsertOne({ collectionname: this.collection, item: model });
        }
    }
}
export class ResourceCtrl extends entityCtrl<Resource> {
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $sce: ng.ISCEService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $sce, $interval, WebSocketClientService, api, userdata);
        console.debug("ResourceCtrl");
        this.collection = "config";
        WebSocketClientService.onSignedin((user: TokenUser) => {
            if (this.id !== null && this.id !== undefined) {
                this.loadData();
            } else {
                try {
                    this.model = new Resource()
                } catch (error) {
                    this.model = {} as any;
                    this.model.name = "";
                    this.model._type = "resource";
                }
            }
        });
    }
    async submit(): Promise<void> {
        try {
            if (this.model._id) {
                await NoderedUtil.UpdateOne({ collectionname: this.collection, item: this.model });
            } else {
                await NoderedUtil.InsertOne({ collectionname: this.collection, item: this.model });
            }
            this.$location.path("/Resources");
        } catch (error) {
            this.errormessage = error.message ? error.message : error;
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
}

export class WorkitemsCtrl extends entitiesCtrl<Base> {
    public queue: string = "";
    public workitemqueues: Base[] = [];
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $interval, WebSocketClientService, api, userdata);
        this.autorefresh = true;
        console.debug("WorkitemsCtrl");
        this.basequery = { _type: "workitem" };
        this.collection = "workitems";
        this.searchfields = ["name", "state", "wiq"];
        this.baseprojection = { name: 1, state: 1, wiq: 1, retries: 1, lastrun: 1, nextrun: 1, priority: 1 };
        this.postloadData = this.processData;
        if (this.userdata.data.WorkitemsCtrl) {
            this.basequery = this.userdata.data.WorkitemsCtrl.basequery;
            this.queue = this.userdata.data.WorkitemsCtrl.queue;
            this.collection = this.userdata.data.WorkitemsCtrl.collection;
            this.baseprojection = this.userdata.data.WorkitemsCtrl.baseprojection;
            this.orderby = this.userdata.data.WorkitemsCtrl.orderby;
            this.searchstring = this.userdata.data.WorkitemsCtrl.searchstring;
            this.basequeryas = this.userdata.data.WorkitemsCtrl.basequeryas;
            this.skipcustomerfilter = this.userdata.data.WorkitemsCtrl.skipcustomerfilter;
        }
        if (!NoderedUtil.IsNullEmpty($routeParams.queue)) this.queue = $routeParams.queue;
        if (!NoderedUtil.IsNullEmpty(this.queue)) {
            this.basequery["wiq"] = this.queue;
        }
        WebSocketClientService.onSignedin(async (user: TokenUser) => {
            // this.workitemqueues = await NoderedUtil.Query({ collectionname: "mq", query: { "_type": "workitemqueue" }, projection: { "name": 1 } });
            NoderedUtil.Query({ collectionname: "mq", query: { "_type": "workitemqueue" }, projection: { "name": 1 }, orderby: 'name' }).then((result) => {
                // result = result.sort((a, b) => a.name.localeCompare(b.name))
                this.workitemqueues = result;
                this.workitemqueues.unshift({ "name": "" } as any)
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
            });
            this.loadData();
        });
    }
    SelectWorkitemqueues() {
        this.basequery = { _type: "workitem" };
        if (!NoderedUtil.IsNullEmpty(this.queue)) {
            this.basequery = { _type: "workitem", "wiq": this.queue };
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
        this.loadData();
    }
    SetState(state) {
        this.page = 0;
        if (state == "" || state == null) {
            delete this.basequery["state"];
        } else {
            if (this.basequery["state"] == state.toLowerCase()) {
                delete this.basequery["state"];
            } else {
                this.basequery["state"] = state.toLowerCase();
            }

        }
        this.loadData();
    }
    async DeleteWorkitem(model) {
        this.loading = true;
        try {
            const q: DeleteWorkitemMessage = new DeleteWorkitemMessage();
            const _msg: Message = new Message();
            q._id = model._id;
            _msg.command = 'deleteworkitem';
            _msg.data = JSON.stringify(q);
            const result: DeleteWorkitemMessage = await WebSocketClient.instance.Send<DeleteWorkitemMessage>(_msg, 1);
            this.loading = false;
            this.loadData();
        } catch (error) {
            this.loading = false;
            this.errormessage = error.message ? error.message : error;
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
        }
    }
    async UpdateWorkitem(model, newstate) {
        this.loading = true;
        try {
            const q: UpdateWorkitemMessage = new UpdateWorkitemMessage();
            const _msg: Message = new Message();
            q._id = model._id;
            q.state = newstate;
            q.ignoremaxretries = true;
            _msg.command = 'updateworkitem';
            _msg.data = JSON.stringify(q);
            const result: UpdateWorkitemMessage = await WebSocketClient.instance.Send<UpdateWorkitemMessage>(_msg, 1);
            this.loading = false;
            this.loadData();
        } catch (error) {
            this.loading = false;
            this.errormessage = error.message ? error.message : error;
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
        }
    }
    async processData(): Promise<void> {
        if (!this.userdata.data.WorkitemsCtrl) this.userdata.data.WorkitemsCtrl = {};
        this.userdata.data.WorkitemsCtrl.basequery = this.basequery;
        this.userdata.data.WorkitemsCtrl.queue = this.queue;
        this.userdata.data.WorkitemsCtrl.collection = this.collection;
        this.userdata.data.WorkitemsCtrl.baseprojection = this.baseprojection;
        this.userdata.data.WorkitemsCtrl.orderby = this.orderby;
        this.userdata.data.WorkitemsCtrl.searchstring = this.searchstring;
        this.userdata.data.WorkitemsCtrl.basequeryas = this.basequeryas;
        this.userdata.data.WorkitemsCtrl.skipcustomerfilter = this.skipcustomerfilter;
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }

}
export class WorkitemCtrl extends entityCtrl<Workitem> {
    public queue: string = "";
    public workitemqueues: Base[];
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $sce: ng.ISCEService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $sce, $interval, WebSocketClientService, api, userdata);
        console.debug("WorkitemCtrl");
        this.collection = "workitems";
        this.postloadData = this.processdata;
        WebSocketClientService.onSignedin(async (user: TokenUser) => {
            if (this.id !== null && this.id !== undefined) {
                await this.loadData();
            } else {
                this.workitemqueues = await NoderedUtil.Query({ collectionname: "mq", query: { "_type": "workitemqueue" }, orderby: "name", projection: { "name": 1 } });
                this.workitemqueues.unshift({ "name": "" } as any)
                this.model = new Workitem();
                this.model.retries = 0;
                this.model.state = "new";
                this.model.payload = {};
                this.model.priority = 2;
                if (this.userdata.data && this.userdata.data.WorkitemsCtrl) this.model.wiq = this.userdata.data.WorkitemsCtrl.queue;
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
            }
        });
    }
    processdata() {
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
        this.fixtextarea();
    }

    fixtextarea() {
        setTimeout(() => {
            const tx = document.getElementsByTagName('textarea');
            for (let i = 0; i < tx.length; i++) {
                tx[i].setAttribute('style', 'height:' + (tx[i].scrollHeight) + 'px;overflow-y:hidden;');
            }
        }, 500);
    }

    async submit(): Promise<void> {
        try {
            var model: any = this.model;
            this.loading = true;
            try {
                if (NoderedUtil.IsNullEmpty(this.model._id)) {
                    const q: AddWorkitemMessage = new AddWorkitemMessage();
                    const _msg: Message = new Message();
                    q.name = model.name;
                    q.wiq = model.wiq;
                    q.payload = model.payload;
                    q.wipriority = model.priority;
                    _msg.command = 'addworkitem';
                    _msg.data = JSON.stringify(q);
                    const result: AddWorkitemMessage = await WebSocketClient.instance.Send<AddWorkitemMessage>(_msg, 1);
                } else {
                    const q: UpdateWorkitemMessage = new UpdateWorkitemMessage();
                    const _msg: Message = new Message();
                    q._id = model._id;
                    q.name = model.name;
                    q.state = model.state;
                    q.payload = model.payload;
                    q.wipriority = model.priority;
                    _msg.command = 'updateworkitem';
                    _msg.data = JSON.stringify(q);
                    const result: UpdateWorkitemMessage = await WebSocketClient.instance.Send<UpdateWorkitemMessage>(_msg, 1);
                }
                this.$location.path("/Workitems");
            } catch (error) {
                this.loading = false;
                this.errormessage = error.message ? error.message : error;
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
            }
        } catch (error) {
            console.error(error);
            this.errormessage = error.message ? error.message : error;
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
}



export class WorkitemQueuesCtrl extends entitiesCtrl<Base> {
    public queue: string = "";
    public workitemqueues: Base[];
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $interval, WebSocketClientService, api, userdata);
        this.autorefresh = true;
        console.debug("WorkitemQueuesCtrl");
        this.basequery = { _type: "workitemqueue" };
        this.collection = "mq";
        this.searchfields = ["name"];
        this.baseprojection = { name: 1, maxretries: 1, projectid: 1, workflowid: 1, robotqueue: 1, amqpqueue: 1, _createdby: 1 };

        this.postloadData = this.processData;
        if (this.userdata.data.WorkitemQueuesCtrl) {
            this.basequery = this.userdata.data.WorkitemQueuesCtrl.basequery;
            this.queue = this.userdata.data.WorkitemQueuesCtrl.queue;
            this.collection = this.userdata.data.WorkitemQueuesCtrl.collection;
            this.baseprojection = this.userdata.data.WorkitemQueuesCtrl.baseprojection;
            this.orderby = this.userdata.data.WorkitemQueuesCtrl.orderby;
            this.searchstring = this.userdata.data.WorkitemQueuesCtrl.searchstring;
            this.basequeryas = this.userdata.data.WorkitemQueuesCtrl.basequeryas;
            this.skipcustomerfilter = this.userdata.data.WorkitemQueuesCtrl.skipcustomerfilter;
        }
        if (!NoderedUtil.IsNullEmpty($routeParams.queue)) this.queue = $routeParams.queue;
        if (!NoderedUtil.IsNullEmpty(this.queue)) {
            this.basequery["wiq"] = this.queue;
        }
        WebSocketClientService.onSignedin(async (user: TokenUser) => {
            this.workitemqueues = await NoderedUtil.Query({ collectionname: "mq", query: { "_type": "workitemqueue" }, projection: { "name": 1 } });
            this.workitemqueues.unshift({ "name": "" } as any)
            this.loadData();
        });
    }
    async DeleteWorkitemQueue(model) {
        this.loading = true;
        try {
            const q: DeleteWorkitemQueueMessage = new DeleteWorkitemQueueMessage();
            const _msg: Message = new Message();
            q._id = model._id;
            _msg.command = 'deleteworkitemqueue';
            _msg.data = JSON.stringify(q);
            const result: DeleteWorkitemQueueMessage = await WebSocketClient.instance.Send<DeleteWorkitemQueueMessage>(_msg, 1);
            this.loading = false;
            this.loadData();
        } catch (error) {
            this.loading = false;
            this.errormessage = error.message ? error.message : error;
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
        }
    }
    async PurgeWorkitemQueue(model) {
        this.loading = true;
        this.errormessage = "";
        try {
            let isExecuted = confirm("Are you sure you want to purge (delete) all workitems from " + model.name + "?\nThis action cannot be undone!");
            if (!isExecuted) return;
            const q: UpdateWorkitemQueueMessage = new UpdateWorkitemQueueMessage();
            const _msg: Message = new Message();
            q._id = model._id;
            q.purge = true;
            q.name = model.name;
            q.workflowid = model.workflowid;
            q.robotqueue = model.robotqueue;
            q.projectid = model.projectid;
            q.amqpqueue = model.amqpqueue;
            // q.maxretries = 5;
            // q.retrydelay = 0;
            // q.initialdelay = 0;

            _msg.command = 'updateworkitemqueue';
            _msg.data = JSON.stringify(q);
            const result: UpdateWorkitemQueueMessage = await WebSocketClient.instance.Send<UpdateWorkitemQueueMessage>(_msg, 1);
            this.loading = false;
            this.loadData();
        } catch (error) {
            this.loading = false;
            this.errormessage = error.message ? error.message : error;
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
        }
    }
    async processData(): Promise<void> {
        if (!this.userdata.data.WorkitemQueuesCtrl) this.userdata.data.WorkitemQueuesCtrl = {};
        this.userdata.data.WorkitemQueuesCtrl.basequery = this.basequery;
        this.userdata.data.WorkitemQueuesCtrl.queue = this.queue;
        this.userdata.data.WorkitemQueuesCtrl.collection = this.collection;
        this.userdata.data.WorkitemQueuesCtrl.baseprojection = this.baseprojection;
        this.userdata.data.WorkitemQueuesCtrl.orderby = this.orderby;
        this.userdata.data.WorkitemQueuesCtrl.searchstring = this.searchstring;
        this.userdata.data.WorkitemQueuesCtrl.basequeryas = this.basequeryas;
        this.userdata.data.WorkitemQueuesCtrl.skipcustomerfilter = this.skipcustomerfilter;
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }

}
export class WorkitemQueueCtrl extends entityCtrl<WorkitemQueue> {
    public projects: Base[] = [];
    public workflows: Base[] = [];
    public users: Base[] = [];
    public amqpqueues: Base[] = [];
    public workitemqueues: Base[] = [];
    public agents: Base[];
    public packages: Base[];

    public stats: string = "calculating...";
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $sce: ng.ISCEService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $sce, $interval, WebSocketClientService, api, userdata);
        console.debug("WorkitemQueueCtrl");
        this.collection = "mq";
        this.postloadData = this.processdata;
        WebSocketClientService.onSignedin(async (user: TokenUser) => {
            try {
                if (this.id !== null && this.id !== undefined) {
                    await this.loadData();
                } else {
                    this.model = new WorkitemQueue();
                    this.model.maxretries = 3;
                    this.model.retrydelay = 0;
                    this.model.initialdelay = 0;
                    this.stats = "No items";
                    if (!this.$scope.$$phase) { this.$scope.$apply(); }
                    await this.loadselects();

                }
            } catch (error) {
                console.error(error);
                this.errormessage = error.message ? error.message : error;
            }
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
        });
    }
    async loadselects() {
        this.projects = await NoderedUtil.Query({ collectionname: "openrpa", query: { "_type": "project" }, projection: { "name": 1 }, orderby: "name" });
        this.projects.forEach((e: any) => { e.display = e.name });
        this.projects.unshift({ "_id": "", "name": "", "display": "(no project)" } as any);
        let queryas: string = null;
        if (this.model != null) queryas = this.model.robotqueue;
        this.workflows = await NoderedUtil.Query({ collectionname: "openrpa", query: { "_type": "workflow" }, projection: { "name": 1, "projectandname": 1 }, orderby: "name", top: 500, queryas });
        this.workflows.forEach((e: any) => { e.display = e.projectandname });
        this.workflows.unshift({ "_id": "", "name": "", "projectandname": "", "display": "(no workflow)" } as any);
        this.users = await NoderedUtil.Query({ collectionname: "users", query: { "$or": [{ "_type": "user" }, { "_type": "role", "rparole": true }] }, orderby: "name", projection: { "name": 1 }, top: 500 });
        this.users.forEach((e: any) => { e.display = e.name });
        this.users.unshift({ "_id": "", "name": "", "display": "(no robot)" } as any);
        this.amqpqueues = await NoderedUtil.Query({ collectionname: "mq", query: { "_type": "queue" }, orderby: "name", projection: { "name": 1 }, top: 500 });
        this.amqpqueues.forEach((e: any) => { e.display = e.name });
        if (this.model) {
            this.amqpqueues.unshift({ "_id": this.model._id, "name": this.model.name, "display": this.model.name } as any);
        }
        this.amqpqueues.unshift({ "_id": "", "name": "", "display": "(no queue)" } as any);
        this.workitemqueues = await NoderedUtil.Query({ collectionname: "mq", query: { "_type": "workitemqueue" }, orderby: "name", projection: { "name": 1 }, top: 500 });
        this.workitemqueues = this.workitemqueues.filter(x => x._id != this.id);
        this.workitemqueues.forEach((e: any) => { e.display = e.name });
        // this.workitemqueues.forEach((e: any) => { this.amqpqueues.push(e) });
        this.workitemqueues.unshift({ "_id": "", "name": "", "display": "(no workitem queue)" } as any);

        this.agents = await NoderedUtil.Query({ collectionname: "agents", query: { "_type": "agent" }, orderby: "name", projection: { "slug": 1, "name": 1 } });
        this.agents.unshift({ "name": "" } as any)
        this.packages = await NoderedUtil.Query({ collectionname: "agents", query: { "_type": "package" }, orderby: "name", projection: { "name": 1 } });
        this.packages.unshift({ "name": "" } as any)
    
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    async processdata() {
        this.loading = false;
        if (NoderedUtil.IsNullEmpty(this.model.projectid)) this.model.projectid = "";
        if (NoderedUtil.IsNullEmpty(this.model.workflowid)) this.model.workflowid = "";
        if (NoderedUtil.IsNullEmpty(this.model.robotqueue)) this.model.robotqueue = "";
        if (NoderedUtil.IsNullEmpty(this.model.amqpqueue)) this.model.amqpqueue = "";
        if (NoderedUtil.IsNullEmpty(this.model.success_wiqid)) this.model.success_wiqid = "";
        if (NoderedUtil.IsNullEmpty(this.model.failed_wiqid)) this.model.failed_wiqid = "";
        await this.loadselects();
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
        var total = 0;
        if (this.id == null || this.id == "") {
            if (this.id != null && this.id != "") {
                total = await NoderedUtil.Count({ collectionname: "workitems", query: { "wiqid": this.id } });
            }
        }
        // this.stats = total + " items";
        // if (!this.$scope.$$phase) { this.$scope.$apply(); }
        if (total > 0) {
            var newitems = await NoderedUtil.Count({ collectionname: "workitems", query: { "wiqid": this.id, "state": "new" } });
            var successfulitems = await NoderedUtil.Count({ collectionname: "workitems", query: { "wiqid": this.id, "state": "successful" } });
            var faileditems = await NoderedUtil.Count({ collectionname: "workitems", query: { "wiqid": this.id, "state": "failed" } });
            var processingitems = await NoderedUtil.Count({ collectionname: "workitems", query: { "wiqid": this.id, "state": "processing" } });
            this.stats = "";
            if (newitems > 0) this.stats += "New: " + newitems;
            if (successfulitems > 0) this.stats += " Successful: " + successfulitems;
            if (faileditems > 0) this.stats += " Failed: " + faileditems;
            if (processingitems > 0) this.stats += " Processing: " + processingitems;
        } else {
            this.stats = "No items";
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }

    async submit(): Promise<void> {
        try {
            var model: any = this.model;
            this.loading = true;
            if (model.success_wiq == null) model.success_wiq = "";
            if (model.success_wiqid == null) model.success_wiqid = "";
            if (model.failed_wiq == null) model.failed_wiq = "";
            if (model.failed_wiqid == null) model.failed_wiqid = "";
            try {
                if (NoderedUtil.IsNullEmpty(this.model._id)) {
                    const q: AddWorkitemQueueMessage = new AddWorkitemQueueMessage();
                    const _msg: Message = new Message();
                    q.name = model.name;
                    q.workflowid = model.workflowid;
                    q.robotqueue = model.robotqueue;
                    q.projectid = model.projectid;
                    q.amqpqueue = model.amqpqueue;
                    q.maxretries = model.maxretries;
                    q.retrydelay = model.retrydelay;
                    q.initialdelay = model.initialdelay;
                    q.success_wiq = model.success_wiq;
                    q.success_wiqid = model.success_wiqid;
                    q.failed_wiq = model.failed_wiq;
                    q.failed_wiqid = model.failed_wiqid;
                    // @ts-ignore
                    q.packageid = model.packageid;
                    if ((q.robotqueue == null || q.robotqueue == "") && (q.amqpqueue == null || q.amqpqueue == "")) {
                        q.amqpqueue = model.name;
                    }
                    _msg.command = 'addworkitemqueue';
                    _msg.data = JSON.stringify(q);
                    const result: AddWorkitemQueueMessage = await WebSocketClient.instance.Send<AddWorkitemQueueMessage>(_msg, 1);
                } else {
                    const q: UpdateWorkitemQueueMessage = new UpdateWorkitemQueueMessage();
                    const _msg: Message = new Message();
                    q._id = model._id;
                    q.name = model.name;
                    q.workflowid = model.workflowid;
                    q.robotqueue = model.robotqueue;
                    q.projectid = model.projectid;
                    q.amqpqueue = model.amqpqueue;
                    q.maxretries = model.maxretries;
                    q.retrydelay = model.retrydelay;
                    q.initialdelay = model.initialdelay;
                    q.success_wiq = model.success_wiq;
                    q.success_wiqid = model.success_wiqid;
                    q.failed_wiq = model.failed_wiq;
                    q.failed_wiqid = model.failed_wiqid;
                    // @ts-ignore
                    q.packageid = model.packageid;
                    _msg.command = 'updateworkitemqueue';
                    _msg.data = JSON.stringify(q);
                    const result: UpdateWorkitemQueueMessage = await WebSocketClient.instance.Send<UpdateWorkitemQueueMessage>(_msg, 1);

                }
                this.$location.path("/WorkitemQueues");
            } catch (error) {
                this.loading = false;
                this.errormessage = error.message ? error.message : error;
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
            }
        } catch (error) {
            console.error(error);
            this.errormessage = error.message ? error.message : error;
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
}


export class MailHistsCtrl extends entitiesCtrl<Role> {
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $interval, WebSocketClientService, api, userdata);
        this.autorefresh = true;
        console.debug("MailHistsCtrl");
        this.basequery = {};
        this.collection = "mailhist";
        this.postloadData = this.processdata;
        this.skipcustomerfilter = true;
        this.baseprojection = { _type: 1, name: 1, _created: 1, _modified: 1, read: 1, readcount: 1, userid: 1 };
        if (this.userdata.data.MailHistsCtrl) {
            this.basequery = this.userdata.data.MailHistsCtrl.basequery;
            this.collection = this.userdata.data.MailHistsCtrl.collection;
            this.baseprojection = this.userdata.data.MailHistsCtrl.baseprojection;
            this.orderby = this.userdata.data.MailHistsCtrl.orderby;
            this.searchstring = this.userdata.data.MailHistsCtrl.searchstring;
            this.basequeryas = this.userdata.data.MailHistsCtrl.basequeryas;
            this.skipcustomerfilter = this.userdata.data.MailHistsCtrl.skipcustomerfilter;
        }
        WebSocketClientService.onSignedin((user: TokenUser) => {
            this.loadData();
        });
    }
    processdata() {
        if (!this.userdata.data.MailHistsCtrl) this.userdata.data.MailHistsCtrl = {};
        this.userdata.data.MailHistsCtrl.basequery = this.basequery;
        this.userdata.data.MailHistsCtrl.collection = this.collection;
        this.userdata.data.MailHistsCtrl.baseprojection = this.baseprojection;
        this.userdata.data.MailHistsCtrl.orderby = this.orderby;
        this.userdata.data.MailHistsCtrl.searchstring = this.searchstring;
        this.userdata.data.MailHistsCtrl.basequeryas = this.basequeryas;
        this.userdata.data.MailHistsCtrl.skipcustomerfilter = this.skipcustomerfilter;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
}


export class MailHistCtrl extends entityCtrl<Base> {
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $sce: ng.ISCEService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $sce, $interval, WebSocketClientService, api, userdata);
        console.debug("MailHist");
        this.collection = "mailhist";
        this.postloadData = this.processData;
        WebSocketClientService.onSignedin(async (user: TokenUser) => {
            if (this.id !== null && this.id !== undefined) {
                await this.loadData();
            } else {
                this.model = new Role();
            }
        });
    }
    async processData(): Promise<void> {
        if (this.model) {
            (this.model as any).opened = (this.model as any).opened.reverse();
        }
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }

    async submit(): Promise<void> {
        try {
            if (this.model._id) {
                await NoderedUtil.UpdateOne({ collectionname: this.collection, item: this.model });
            } else {
                this.model = await NoderedUtil.InsertOne({ collectionname: this.collection, item: this.model });
            }
            this.$location.path("/MailHists");
        } catch (error) {
            console.error(error);
            this.errormessage = error.message ? error.message : error;
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
}
export class WebsocketClientsCtrl extends entitiesCtrl<Base> {
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $interval, WebSocketClientService, api, userdata);
        console.debug("WebsocketClientsCtrl");
        this.basequery = { _type: "websocketclient" };
        this.collection = "websocketclients";
        // this.preloadData = () => {
        //     NoderedUtil.CustomCommand({ "command": "dumpwebsocketclients" });
        // };
        this.postloadData = this.processData;
        this.skipcustomerfilter = true;
        if (this.userdata.data.WebsocketClientsCtrl) {
            this.basequery = this.userdata.data.WebsocketClientsCtrl.basequery;
            this.collection = this.userdata.data.WebsocketClientsCtrl.collection;
            this.baseprojection = this.userdata.data.WebsocketClientsCtrl.baseprojection;
            this.orderby = this.userdata.data.WebsocketClientsCtrl.orderby;
            this.searchstring = this.userdata.data.WebsocketClientsCtrl.searchstring;
            this.basequeryas = this.userdata.data.WebsocketClientsCtrl.basequeryas;
        }

        WebSocketClientService.onSignedin((user: TokenUser) => {
            this.loadData();
        });
    }
    async processData(): Promise<void> {
        if (!this.userdata.data.WebsocketClientsCtrl) this.userdata.data.WebsocketClientsCtrl = {};
        this.userdata.data.WebsocketClientsCtrl.basequery = this.basequery;
        this.userdata.data.WebsocketClientsCtrl.collection = this.collection;
        this.userdata.data.WebsocketClientsCtrl.baseprojection = this.baseprojection;
        this.userdata.data.WebsocketClientsCtrl.orderby = this.orderby;
        this.userdata.data.WebsocketClientsCtrl.searchstring = this.searchstring;
        this.userdata.data.WebsocketClientsCtrl.basequeryas = this.basequeryas;
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    async DumpClients(): Promise<void> {
        await NoderedUtil.CustomCommand({ "command": "dumpwebsocketclients" });
        await new Promise(resolve => { setTimeout(resolve, 1000) });
        this.loading = false;
        this.page = 0;
        this.loadData();
    }
    async KillClient(id): Promise<void> {
        await NoderedUtil.CustomCommand({ "command": "killwebsocketclient", id });
        this.loading = false;
        this.loadData();
    }

}


export class ConsoleCtrl extends entityCtrl<RPAWorkflow> {
    public arguments: any;
    public users: TokenUser[];
    public user: TokenUser;
    public messages: any[] = [];
    public watchid: string = "";
    public timeout: string = (60 * 1000).toString(); // 1 min;
    public lines: string = "100";
    public exchange: RegisterExchangeResponse = null;
    public paused: boolean = false;
    public host: boolean = false;
    public agent: boolean = false;
    public cls: boolean = false;
    public func: boolean = true;
    public searchstring: string = "";
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $sce: ng.ISCEService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $sce, $interval, WebSocketClientService, api, userdata);
        console.debug("ConsoleCtrl");
        this.collection = "config";
        this.basequery = { "_type": "config" }
        this.messages = [];
        WebSocketClientService.onSignedin(async (_user: TokenUser) => {
            await this.RegisterQueue();
            this.loadData();
            this.loading = false;
            this.$scope.$on('signin', (event, data) => {
                this.RegisterQueue();
                this.loadData();
                this.loading = false;
            });
        });
    }
    async RegisterQueue() {
        try {
            if (this.exchange != null) {
                try {
                    await NoderedUtil.CloseQueue({ queuename: this.exchange.queuename });
                } catch (error) {
                    console.log(error);
                }
            }
            this.exchange = await NoderedUtil.RegisterExchange({
                algorithm: "fanout", exchangename: "openflow_logs", callback: (data: QueueMessage, ack: any) => {
                    ack();
                    if (this.paused) return;
                    if (data.data.lvl == 0) data.data.lvl = "inf"
                    if (data.data.lvl == 1) data.data.lvl = "err"
                    if (data.data.lvl == 2) data.data.lvl = "war"
                    if (data.data.lvl == 3) data.data.lvl = "inf"
                    if (data.data.lvl == 4) data.data.lvl = "dbg"
                    if (data.data.lvl == 5) data.data.lvl = "ver"
                    if (data.data.lvl == 6) data.data.lvl = "sil"
                    this.messages.unshift(data.data);
                    var lines = parseInt(this.lines);
                    // if messages has more than 1000 rows, then remove the last 500 rows
                    if (this.messages.length >= lines) this.messages.splice(lines - 1);
                    if (!this.$scope.$$phase) { this.$scope.$apply(); }
                }, closedcallback: (msg) => {
                    setTimeout(this.RegisterQueue.bind(this), (Math.floor(Math.random() * 6) + 1) * 500);
                }
            });
            if (!NoderedUtil.IsNullEmpty(this.watchid)) {
                await NoderedUtil.UnWatch({ id: this.watchid });
            }
            this.watchid = await NoderedUtil.Watch({
                aggregates: [{ "$match": { "fullDocument._type": "config" } }], collectionname: "config", callback: (data) => {
                    this.loadData();
                }
            })
        } catch (error) {
            console.debug("register queue failed, start reconnect. " + error.message ? error.message : error)
            setTimeout(this.RegisterQueue.bind(this), (Math.floor(Math.random() * 6) + 1) * 500);
        }
    }
    async submit(): Promise<void> {
        try {
            if (this.model._id) {
                await NoderedUtil.UpdateOne({ collectionname: this.collection, item: this.model });
            } else {
                await NoderedUtil.InsertOne({ collectionname: this.collection, item: this.model });
            }
            // this.$location.path("/Providers");
        } catch (error) {
            this.errormessage = error.message ? error.message : error;
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    async ClearCache() {
        try {
            await NoderedUtil.CustomCommand({ command: "clearcache" });
        } catch (error) {
            this.errormessage = error.message ? error.message : error;
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    async MemoryDump() {
        try {
            await NoderedUtil.CustomCommand({ command: "heapdump" });
        } catch (error) {
            this.errormessage = error.message ? error.message : error;
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    async StartHousekeeping() {
        try {
            const skipnodered = false;
            const skipcalculatesize = false;
            const skipupdateusersize = false;
            await NoderedUtil.HouseKeeping({ skipnodered, skipcalculatesize, skipupdateusersize });
        } catch (error) {
            this.errormessage = error.message ? error.message : error;
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    hasprop(name) {
        return this.messages.filter(x => !NoderedUtil.IsNullEmpty(x[name])).length > 0
    }
    ismatch(model) {
        if (this.searchstring == '') return true;
        if (model.func && model.func.indexOf(this.searchstring) > -1) return true;
        if (model.collection && model.collection.indexOf(this.searchstring) > -1) return true;
        if (model.user && model.user.indexOf(this.searchstring) > -1) return true;
        var message = model.message;
        if (typeof message == "object") {
            if (message.hasOwnProperty("stack") && message.hasOwnProperty("message")) {
                message = message.message;
            } else {
                message = JSON.stringify(message);
            }
        }
        if (message && message.indexOf(this.searchstring) > -1) return true;
        return false;
    }
    highlight(message) {
        if (typeof message == "object") {
            if (message.hasOwnProperty("stack") && message.hasOwnProperty("message")) {
                message = message.message;
            } else {
                message = JSON.stringify(message);
            }
        }
        if (this.searchstring == null || this.searchstring == "") return message;
        if (message == null || message == "") return "";
        return message.replace(
            new RegExp(this.searchstring + '(?!([^<]+)?<)', 'gi'),
            '<span class="highlight">$&</span>'
        )
    }
    CopySecret(model) {
        navigator.clipboard.writeText(JSON.stringify(model, null, 2)).then(function () {
            console.log('Async: Copying to clipboard was successful!');
        }, function (err) {
            console.error('Async: Could not copy text: ', err);
        });
    }
}

export class ConfigCtrl extends entityCtrl<RPAWorkflow> {
    public arguments: any;
    public users: TokenUser[];
    public user: TokenUser;
    public messages: any[] = [];
    public watchid: string = "";
    public timeout: string = (60 * 1000).toString(); // 1 min;
    public lines: string = "100";
    public exchange: RegisterExchangeResponse = null;
    public paused: boolean = false;
    public host: boolean = false;
    public agent: boolean = false;
    public cls: boolean = false;
    public func: boolean = true;
    public searchstring: string = "";
    public settings: any[] = [];
    public show: "all" | "set" | "unset" = "set";
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $sce: ng.ISCEService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $sce, $interval, WebSocketClientService, api, userdata);
        console.debug("ConsoleCtrl");
        this.collection = "config";
        this.basequery = { "_type": "config" }
        this.messages = [];
        this.postloadData = this.processdata;
        this.settings = [
            // {"name": "supports_watch", "type": "boolean", "default": "false"},
            // {"name": "NODE_ENV", "type": "string", "default": "development"},
            // {"name": "log_to_exchange", "type": "boolean", "default": "false"}, // called straming handled elsewere
            // {"name": "aes_secret", "type": "string", "default": ""}, // ONLY envoriment variable
            // {"name": "signing_crt", "type": "string", "default": ""}, // ONLY envoriment variable
            // {"name": "singing_key", "type": "string", "default": ""}, // ONLY envoriment variable
            {"name": "license_key", "type": "string", "default": ""},
            {"name": "enable_openapi", "type": "boolean", "default": "true"},
            {"name": "enable_grafanaapi", "type": "boolean", "default": "true"},
            {"name": "llmchat_queue", "type": "string", "default": ""},
            {"name": "log_with_colors", "type": "boolean", "default": "true"},
            {"name": "log_database_queries_to_collection", "type": "string", "default": ""},
            {"name": "cache_store_type", "type": "string", "default": "memory"},
            {"name": "cache_store_max", "type": "number", "default": "1000"},
            {"name": "cache_store_ttl_seconds", "type": "number", "default": "300"},
            {"name": "cache_store_redis_host", "type": "string", "default": ""},
            {"name": "cache_store_redis_port", "type": "number", "default": "6379"},
            {"name": "cache_store_redis_password", "type": "string", "default": ""},
            {"name": "cache_workitem_queues", "type": "boolean", "default": "false"},
            {"name": "heapdump_onstop", "type": "boolean", "default": "false"},
            {"name": "amqp_allow_replyto_empty_queuename", "type": "boolean", "default": "false"},
            {"name": "enable_openflow_amqp", "type": "boolean", "default": "false"},
            {"name": "openflow_amqp_expiration", "type": "number", "default": "1500000"}, 
            {"name": "amqp_prefetch", "type": "number", "default": "25"},
            {"name": "enable_entity_restriction", "type": "boolean", "default": "false"},
            {"name": "enable_web_tours", "type": "boolean", "default": "true"},
            {"name": "enable_nodered_tours", "type": "boolean", "default": "true"},
            {"name": "grafana_url", "type": "string", "default": ""},
            {"name": "auto_hourly_housekeeping", "type": "boolean", "default": "true"},
            {"name": "housekeeping_skip_calculate_size", "type": "boolean", "default": "false"},
            {"name": "housekeeping_skip_update_user_size", "type": "boolean", "default": "false"},    
            {"name": "housekeeping_skip_collections", "type": "string", "default": ""},
            {"name": "housekeeping_remove_unvalidated_user_days", "type": "number", "default": "0"},
            {"name": "housekeeping_cleanup_openrpa_instances", "type": "boolean", "default": "false"},
            {"name": "workitem_queue_monitoring_enabled", "type": "boolean", "default": "true"},
            {"name": "workitem_queue_monitoring_interval", "type": "number", "default": "10000"},
            {"name": "upload_max_filesize_mb", "type": "number", "default": "25"},
            {"name": "getting_started_url", "type": "string", "default": ""},
            {"name": "HTTP_PROXY", "type": "string", "default": ""},
            {"name": "HTTPS_PROXY", "type": "string", "default": ""},
            {"name": "NO_PROXY", "type": "string", "default": ""},
            {"name": "agent_HTTP_PROXY", "type": "string", "default": ""},
            {"name": "agent_HTTPS_PROXY", "type": "string", "default": ""},
            {"name": "agent_NO_PROXY", "type": "string", "default": ""},
            {"name": "agent_NPM_REGISTRY", "type": "string", "default": ""},
            {"name": "agent_NPM_TOKEN", "type": "string", "default": ""},            
            {"name": "stripe_api_key", "type": "string", "default": ""},
            {"name": "stripe_api_secret", "type": "string", "default": ""},
            {"name": "stripe_force_vat", "type": "boolean", "default": "false"},
            {"name": "stripe_force_checkout", "type": "boolean", "default": "false"},
            {"name": "stripe_allow_promotion_codes", "type": "boolean", "default": "true"},
            {"name": "ensure_indexes", "type": "boolean", "default": "true"},
            {"name": "text_index_name_fields", "type": "string[]", "default": "name,_names"},
            {"name": "auto_create_users", "type": "boolean", "default": "false"},
            {"name": "auto_create_user_from_jwt", "type": "boolean", "default": "false"},
            {"name": "auto_create_domains", "type": "string[]", "default": ""},
            {"name": "persist_user_impersonation", "type": "boolean", "default": "false"},
            {"name": "ping_clients_interval", "type": "number", "default": "10000"}, // 10 seconds
            {"name": "use_ingress_beta1_syntax", "type": "boolean", "default": "false"},
            {"name": "use_openshift_routes", "type": "boolean", "default": "false"},
            {"name": "agent_image_pull_secrets", "type": "string[]", "default": "[]"},
            {"name": "auto_create_personal_nodered_group", "type": "boolean", "default": "false"},
            {"name": "auto_create_personal_noderedapi_group", "type": "boolean", "default": "false"},
            {"name": "force_add_admins", "type": "boolean", "default": "true"},
            {"name": "validate_emails", "type": "boolean", "default": "false"},
            {"name": "forgot_pass_emails", "type": "boolean", "default": "false"},
            {"name": "smtp_service", "type": "string", "default": ""},
            {"name": "smtp_from", "type": "string", "default": ""},
            {"name": "smtp_user", "type": "string", "default": ""},
            {"name": "smtp_pass", "type": "string", "default": ""},
            {"name": "smtp_url", "type": "string", "default": ""},
            {"name": "debounce_lookup", "type": "boolean", "default": "false"},
            {"name": "validate_emails_disposable", "type": "boolean", "default": "false"},
            {"name": "tls_crt", "type": "string", "default": ""},
            {"name": "tls_key", "type": "string", "default": ""},
            {"name": "tls_ca", "type": "string", "default": ""},
            {"name": "tls_passphrase", "type": "string", "default": ""},
        
            {"name": "oidc_access_token_ttl", "type": "number", "default": "480"},
            {"name": "oidc_authorization_code_ttl", "type": "number", "default": "480"},
            {"name": "oidc_client_credentials_ttl", "type": "number", "default": "480"},
            {"name": "oidc_refresh_token_ttl", "type": "number", "default": "20160"},
            {"name": "oidc_session_ttl", "type": "number", "default": "20160"},
        
            {"name": "oidc_cookie_key", "type": "string", "default": ""},
            {"name": "api_rate_limit", "type": "boolean", "default": "true"},
            {"name": "api_rate_limit_points", "type": "number", "default": "20"},
            {"name": "api_rate_limit_duration", "type": "number", "default": "1"},
            {"name": "socket_rate_limit", "type": "boolean", "default": "true"},
            {"name": "socket_rate_limit_points", "type": "number", "default": "30"},
            {"name": "socket_rate_limit_points_disconnect", "type": "number", "default": "100"},
            {"name": "socket_rate_limit_duration", "type": "number", "default": "1"},
            {"name": "socket_error_rate_limit_points", "type": "number", "default": "30"},
            {"name": "socket_error_rate_limit_duration", "type": "number", "default": "1"},
        
            {"name": "client_heartbeat_timeout", "type": "number", "default": "60"},
            {"name": "client_signin_timeout", "type": "number", "default": "120"},
            {"name": "client_disconnect_signin_error", "type": "boolean", "default": "false"},
        
            {"name": "expected_max_roles", "type": "number", "default": "20000"},
            {"name": "decorate_roles_fetching_all_roles", "type": "boolean", "default": "true"},
            {"name": "max_recursive_group_depth", "type": "number", "default": "2"},
            {"name": "update_acl_based_on_groups", "type": "boolean", "default": "true"},
            {"name": "allow_merge_acl", "type": "boolean", "default": "false"},
        
            {"name": "multi_tenant", "type": "boolean", "default": "false"},
            {"name": "enable_guest", "type": "boolean", "default": "false"},
            {"name": "enable_gitserver", "type": "boolean", "default": "false"},
            {"name": "enable_gitserver_guest", "type": "boolean", "default": "false"},
            {"name": "enable_gitserver_guest_create", "type": "boolean", "default": "false"},
            
        
            {"name": "cleanup_on_delete_customer", "type": "boolean", "default": "false"},
            {"name": "cleanup_on_delete_user", "type": "boolean", "default": "false"},
            {"name": "api_bypass_perm_check", "type": "boolean", "default": "false"},
            {"name": "allow_signin_with_expired_jwt", "type": "boolean", "default": "false"},
            {"name": "force_audit_ts", "type": "boolean", "default": "false"},
            {"name": "force_dbusage_ts", "type": "boolean", "default": "false"},
            {"name": "migrate_audit_to_ts", "type": "boolean", "default": "true"},
            {"name": "websocket_package_size", "type": "number", "default": "25000"},
            {"name": "websocket_max_package_count", "type": "number", "default": "1048576"},
            {"name": "websocket_message_callback_timeout", "type": "number", "default": "3600"},
            {"name": "websocket_disconnect_out_of_sync", "type": "boolean", "default": "false"},
            {"name": "protocol", "type": "string", "default": "http"},
            {"name": "port", "type": "number", "default": "3000"},
            {"name": "cookie_secret", "type": "string", "default": "NLgUIsozJaxO38ze0WuHthfj2eb1eIEu"},
            {"name": "max_ace_count", "type": "number", "default": "128"},
        
            {"name": "amqp_reply_expiration", "type": "number", "default": "60000"},
            {"name": "amqp_force_queue_prefix", "type": "boolean", "default": "false"},
            {"name": "amqp_force_exchange_prefix", "type": "boolean", "default": "false"},
            {"name": "amqp_force_sender_has_read", "type": "boolean", "default": "true"},
            {"name": "amqp_force_sender_has_invoke", "type": "boolean", "default": "false"},
            {"name": "amqp_force_consumer_has_update", "type": "boolean", "default": "false"},
            {"name": "amqp_enabled_exchange", "type": "boolean", "default": "false"},
            {"name": "amqp_url", "type": "string", "default": "amqp://localhost"},
            {"name": "amqp_username", "type": "string", "default": "guest"},
            {"name": "amqp_password", "type": "string", "default": "guest"},
        
            {"name": "amqp_check_for_consumer", "type": "boolean", "default": "true"},
            {"name": "amqp_check_for_consumer_count", "type": "boolean", "default": "false"},
            {"name": "amqp_default_expiration", "type": "number", "default": "60000"},
            {"name": "amqp_requeue_time", "type": "number", "default": "1000"},
            {"name": "amqp_dlx", "type": "string", "default": "openflow-dlx"},
        
            {"name": "mongodb_minpoolsize", "type": "number", "default": "25"},
            {"name": "mongodb_maxpoolsize", "type": "number", "default": "25"},

            {"name": "skip_history_collections", "type": "string", "default": "audit,oauthtokens,openrpa_instances,workflow_instances,workitems,mailhist"},
            {"name": "history_delta_count", "type": "number", "default": "1000"},
            {"name": "history_obj_max_kb_size", "type": "number", "default": "10240"},
            {"name": "allow_skiphistory", "type": "boolean", "default": "false"},
            {"name": "max_memory_restart_mb", "type": "number", "default": "0"},
            {"name": "saml_issuer", "type": "string", "default": "the-issuer"},
            {"name": "wapid_mail", "type": "string", "default": ""},
            {"name": "wapid_pub", "type": "string", "default": ""},
            {"name": "wapid_key", "type": "string", "default": ""},
            {"name": "shorttoken_expires_in", "type": "string", "default": "5m"},
            {"name": "longtoken_expires_in", "type": "string", "default": "365d"},
            {"name": "downloadtoken_expires_in", "type": "string", "default": "15m"},
            {"name": "personalnoderedtoken_expires_in", "type": "string", "default": "365d"},
            {"name": "agent_images", "type": "NoderedImage[]", "default": "[{\"name\":\"Agent\", \"image\":\"openiap/nodeagent\", \"languages\": [\"nodejs\", \"python\"]}, {\"name\":\"Agent+Chromium\", \"image\":\"openiap/nodechromiumagent\", \"chromium\": true, \"languages\": [\"nodejs\", \"python\"]}, {\"name\":\"NodeRED\", \"image\":\"openiap/noderedagent\", \"port\": 3000}, {\"name\":\"DotNet 6\", \"image\":\"openiap/dotnetagent\", \"languages\": [\"dotnet\"]} , {\"name\":\"PowerShell 7.3\", \"image\":\"openiap/nodeagent:pwsh\", \"languages\": [\"powershell\"]}]"},
            {"name": "agent_domain_schema", "type": "string", "default": ""},
            {"name": "agent_node_selector", "type": "string", "default": ""},
            {"name": "agent_grpc_apihost", "type": "string", "default": ""},
            {"name": "agent_ws_apihost", "type": "string", "default": ""},
            {"name": "agent_oidc_config", "type": "string", "default": ""},
            {"name": "agent_oidc_client_id", "type": "string", "default": ""},
            {"name": "agent_oidc_client_secret", "type": "string", "default": ""},
            {"name": "agent_oidc_userinfo_endpoint", "type": "string", "default": ""},
            {"name": "agent_oidc_issuer", "type": "string", "default": ""},
            {"name": "agent_oidc_authorization_endpoint", "type": "string", "default": ""},
            {"name": "agent_oidc_token_endpoint", "type": "string", "default": ""},
            {"name": "saml_federation_metadata", "type": "string", "default": ""},
            {"name": "agent_docker_entrypoints", "type": "string", "default": "web"},
            {"name": "agent_docker_use_project", "type": "boolean", "default": "false"},
            {"name": "agent_docker_certresolver", "type": "string", "default": ""},
            {"name": "namespace", "type": "string", "default": ""},
            {"name": "agent_allow_nodeselector", "type": "boolean", "default": "false"},

            {"name": "otel_measure_nodeid", "type": "boolean", "default": "false"},
            {"name": "otel_measure_queued_messages", "type": "boolean", "default": "false"},
            {"name": "otel_measure__mongodb_watch", "type": "boolean", "default": "false"},
            {"name": "enable_analytics", "type": "boolean", "default": "true"},
            {"name": "enable_detailed_analytic", "type": "boolean", "default": "false"},
            {"name": "otel_debug_log", "type": "boolean", "default": "false"},
            {"name": "otel_warn_log", "type": "boolean", "default": "false"},
            {"name": "otel_err_log", "type": "boolean", "default": "false"},
            {"name": "otel_trace_url", "type": "string", "default": ""},
            {"name": "otel_metric_url", "type": "string", "default": ""},
            {"name": "otel_trace_interval", "type": "number", "default": "5000"},
            {"name": "otel_metric_interval", "type": "number", "default": "5000"},
            {"name": "otel_trace_pingclients", "type": "boolean", "default": "false"},
            {"name": "otel_trace_dashboardauth", "type": "boolean", "default": "false"},
            {"name": "otel_trace_include_query", "type": "boolean", "default": "false"},
            {"name": "otel_trace_connection_ips", "type": "boolean", "default": "false"},
            {"name": "otel_trace_mongodb_per_users", "type": "boolean", "default": "false"},
            {"name": "otel_trace_mongodb_query_per_users", "type": "boolean", "default": "false"},
            {"name": "otel_trace_mongodb_count_per_users", "type": "boolean", "default": "false"},
            {"name": "otel_trace_mongodb_aggregate_per_users", "type": "boolean", "default": "false"},
            {"name": "otel_trace_mongodb_insert_per_users", "type": "boolean", "default": "false"},
            {"name": "otel_trace_mongodb_update_per_users", "type": "boolean", "default": "false"},
            {"name": "otel_trace_mongodb_delete_per_users", "type": "boolean", "default": "false"},

            {"name": "grpc_keepalive_time_ms", "type": "number", "default": "-1"},
            {"name": "grpc_keepalive_timeout_ms", "type": "number", "default": "-1"},
            {"name": "grpc_http2_min_ping_interval_without_data_ms", "type": "number", "default": "-1"},
            {"name": "grpc_max_connection_idle_ms", "type": "number", "default": "-1"},
            {"name": "grpc_max_connection_age_ms", "type": "number", "default": "-1"},
            {"name": "grpc_max_connection_age_grace_ms", "type": "number", "default": "-1"},
            {"name": "grpc_http2_max_pings_without_data", "type": "number", "default": "-1"},
            {"name": "grpc_keepalive_permit_without_calls", "type": "number", "default": "-1"},
            {"name": "grpc_max_receive_message_length", "type": "number", "default": "-1"},
            {"name": "grpc_max_send_message_length", "type": "number", "default": "-1"},
            {"name": "validate_user_form", "type": "string", "default": ""}
        ]
        WebSocketClientService.onSignedin(async (_user: TokenUser) => {
            await this.RegisterWatch();
            this.loading = false;
            this.loadData();
            this.$scope.$on('signin', (event, data) => {
                this.RegisterWatch();
                this.loading = false;
                this.loadData();
            });
        });
    }
    SetState(state: "all" | "set" | "unset") {
        this.show = state;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    Show(setting) {
        if(this.model == null) return false;
        if(this.show == "all") return true;
        var isset = this.model[setting.name] != null;
        if(this.show == "set" && isset) return true;
        if(this.show == "unset" && !isset) return true;
        return false;
    }
    Toggle(el, name) {
        if(this.model == null) return;
        console.log(name, this.model[name])
        if(this.model[name] == null) {
            var de = this.settings.filter(x => x.name == name)[0].default;
            if(de == "true") {
                de = true;
            } else {
                de = false;
            }
            console.log("default", de)
            this.model[name] = !de;
            el.checked = this.model[name];
        } else {
            this.model[name] = !this.model[name];
            el.checked = this.model[name];
        }
        console.log(name, this.model[name])
        this.delayedUpdate();
    }
    async RegisterWatch() {
        try {
            if (!NoderedUtil.IsNullEmpty(this.watchid)) {
                await NoderedUtil.UnWatch({ id: this.watchid });
            }
            this.watchid = await NoderedUtil.Watch({
                aggregates: [{ "$match": { "fullDocument._type": "config" } }], collectionname: "config", callback: (data) => {
                    this.loading = false;
                    this.loadData();
                }
            })
        } catch (error) {
            console.debug("register queue failed, start reconnect. " + error.message ? error.message : error)
            setTimeout(this.RegisterWatch.bind(this), (Math.floor(Math.random() * 6) + 1) * 500);
        }
    }
    deletekey(key: string) {
        delete this.model[key]; 
        this.delayedUpdate();
        this.submit();
    }
    processdata() {
        if (this.model._encrypt == null) { this.model._encrypt = []; }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
        this.fixtextarea();
        this.loading = false;
    }
    async submit(): Promise<void> {
        try {
            if (this.model._id) {
                await NoderedUtil.UpdateOne({ collectionname: this.collection, item: this.model });
            } else {
                await NoderedUtil.InsertOne({ collectionname: this.collection, item: this.model });
            }
            // this.$location.path("/Providers");
        } catch (error) {
            this.errormessage = error.message ? error.message : error;
        }
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    hasprop(name) {
        return this.messages.filter(x => !NoderedUtil.IsNullEmpty(x[name])).length > 0
    }
    cached = {}
    getstep(key, obj) {
        if (this.gettype(obj) == "number") {
            if (obj.toString().indexOf(".") > -1) {
                var decimals = obj.toString().split(".")[1].length;
                this.cached[key] = 1 / Math.pow(10, decimals);
                return this.cached[key];
            } else {
                if (this.cached[key]) return this.cached[key];
            }
        }
        this.cached[key] = 1;
        return 1;
    }
    gettype(obj) {
        return typeof obj;
    }
    getinputtype(obj, key) {
        if (this.model._encrypt.indexOf(key))
            if (typeof obj === "string") return "text";
        if (typeof obj === "number") return "number";
        if (typeof obj === "boolean") return "checkbox";
    }
 
    isobject(object: any) {
        return typeof object === 'object';
    }
    fixtextarea() {
        setTimeout(() => {
            const tx = document.getElementsByTagName('textarea');
            for (let i = 0; i < tx.length; i++) {
                tx[i].setAttribute('style', 'height:' + (tx[i].scrollHeight) + 'px;overflow-y:hidden;');
            }
        }, 500);
    }
    delayhandler = null;
    delayedUpdate() {
        console.log("delayedUpdate")
        if(this.loading == true) return;
        if(this.delayhandler ! = null) return;
        this.loading = true;
        this.delayhandler = setTimeout(() => {
            this.delayhandler = null;
            this.submit();
        }, 500);
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
}


export class AgentsCtrl extends entitiesCtrl<Base> {
    public show: string = "all";
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $interval, WebSocketClientService, api, userdata);
        this.autorefresh = true;
        console.debug("AgentsCtrl");
        this.basequery = { _type: "agent" };
        this.collection = "agents";
        this.postloadData = this.processdata;
        this.searchfields = ["name", "slug"];
        this.orderby = { "_modified": -1 }
        this.baseprojection = { _type: 1, name: 1, _created: 1, _modified: 1, image: 1, stripeprice: 1, webserver: 1, runas: 1, _createdby: 1, slug: 1, arch: 1, os:1 };
        if (this.userdata.data.AgentsCtrl) {
            this.basequery = this.userdata.data.AgentsCtrl.basequery;
            this.collection = this.userdata.data.AgentsCtrl.collection;
            this.baseprojection = this.userdata.data.AgentsCtrl.baseprojection;
            this.orderby = this.userdata.data.AgentsCtrl.orderby;
            this.searchstring = this.userdata.data.AgentsCtrl.searchstring;
            this.basequeryas = this.userdata.data.AgentsCtrl.basequeryas;
            this.skipcustomerfilter = this.userdata.data.AgentsCtrl.skipcustomerfilter;
        }
        this.preloadData = this.preLoad.bind(this);
        WebSocketClientService.onSignedin((user: TokenUser) => {
            this.loadData();
        });
    }
    knownpods = [];
    clients = [];
    getStatus(model) {
        var instances = this.knownpods.filter(x => (x.metadata.labels && (x.metadata.labels.app == model.slug || x.metadata.labels.slug == model.slug)) || (x.metadata.name == model.slug));
        for (var x = 0; x < instances.length; x++) {
            var instance = instances[x]
            model.status = "missing"
            if (instance.status && instance.status.phase) {
                model.status = instance.status.phase;
            }
            if (model.status == "running" || model.status == "Running") {
                if (instance.status != null && instance.status.containerStatuses != null && instance.status.containerStatuses.length > 0) {
                    model.status = instance.status.containerStatuses[0].started ? "running" : "stopped " + instance.status.containerStatuses[0].state.waiting.reason;
                }
            }
            if (instance.metadata.deletionTimestamp) model.status = "deleting"
        }
        if (instances.length == 0) {
            model.status = "missing"
        }
        if(model.status == "missing") {
            if(model.image == null) {
                var cli = this.clients.filter(x=> x.user?._id ==model.runas && (x.agent == "nodeagent" || x.agent == "assistant"));
                if(cli != null && cli.length > 0) {
                    model.status = "online"
                }
            } else if(model.image.indexOf("nodered") > -1) {
                var cli = this.clients.filter(x=> x.user?._id ==model.runas && x.agent == "nodered");
                if(cli != null && cli.length > 0) {
                    model.status = "online"
                }
            } else if(model.image.indexOf("agent") > -1) {
                var cli = this.clients.filter(x=> x.user?._id ==model.runas && (x.agent == "nodeagent" || x.agent == "python") );
                if(cli != null && cli.length > 0) {
                    model.status = "online"
                }
            }
        }
        // if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    trimimage(image: string) {
        if (image == null) return "";
        while (image.indexOf("/") != image.lastIndexOf("/")) {
            image = image.substring(image.indexOf("/") + 1);
        }
        // remove tag too ?
        // if (!NoderedUtil.IsNullEmpty(image) && image.indexOf(':') > -1) {
        //     image = image.split(':')[0];
        // }
        return image;
    }
    async preLoad() {
        if (this.show == "pods") {
            this.knownpods = await NoderedUtil.CustomCommand({ command: "getagentpods" })
            const slugs = this.knownpods.map(x => x.metadata.labels.slug).filter(x => x != null);
            this.basequery = { _type: "agent", slug: { $in: slugs } };            
        } else if (this.show != "all" ) {
            this.basequery = { _type: "agent" };
            this.basequery[this.show] = true;
        } else {
            this.basequery = { _type: "agent" };
        }
    }
    async processdata() {
        if (!this.userdata.data.AgentsCtrl) this.userdata.data.AgentsCtrl = {};
        this.userdata.data.AgentsCtrl.basequery = this.basequery;
        this.userdata.data.AgentsCtrl.collection = this.collection;
        this.userdata.data.AgentsCtrl.baseprojection = this.baseprojection;
        this.userdata.data.AgentsCtrl.orderby = this.orderby;
        this.userdata.data.AgentsCtrl.searchstring = this.searchstring;
        this.userdata.data.AgentsCtrl.basequeryas = this.basequeryas;
        this.userdata.data.AgentsCtrl.skipcustomerfilter = this.skipcustomerfilter;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }

        for (var i = 0; i < this.models.length; i++) {
            var model = this.models[i];
            var user = await NoderedUtil.Query({ collectionname: "users", query: { _id: (model as any).runas }, top: 1 });
            if(user != null && user.length > 0) {
                // @ts-ignore
                model.customerid = user[0].customerid;
            }
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }

        this.knownpods = await NoderedUtil.CustomCommand({ command: "getagentpods" })
        this.clients = await NoderedUtil.CustomCommand({ "command": "getclients" });

        for (var i = 0; i < this.models.length; i++) {
            var model = this.models[i];
            // @ts-ignore
            // model.status = "...";
            await this.getStatus(model)
        }
        if (this.orderby != null && this.orderby["status"] != null) {
            if (this.orderby["status"] == 1) {
                this.models.sort(function (a: any, b: any) {
                    return ('' + a.status).localeCompare(b.status);
                })
            } else {
                this.models.sort(function (a: any, b: any) {
                    return ('' + b.status).localeCompare(a.status);
                })
            }
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    weburl(model) {
        return "//" + this.WebSocketClientService.agent_domain_schema.replace("$slug$", model.slug)
    }
    async DeleteAgent(model: any): Promise<void> {
        try {
            this.loading = true;
            this.errormessage = "";
            await NoderedUtil.CustomCommand({ command: "deleteagent", id: model._id })
            this.loading = false;
            setTimeout(this.loadData.bind(this), 500)
        } catch (error) {
            this.errormessage = error.message ? error.message : error

        }
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    async StopAgent(model: any): Promise<void> {
        try {
            this.loading = true;
            this.errormessage = "";
            await NoderedUtil.CustomCommand({ command: "stopagent", id: model._id, name: model.slug })
            await this.getStatus(model);
        } catch (error) {
            this.errormessage = error.message ? error.message : error
        }
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    async StartAgent(model: any): Promise<void> {
        try {
            this.loading = true;
            this.errormessage = "";
            await NoderedUtil.CustomCommand({ command: "startagent", id: model._id, name: model.slug })
            await this.getStatus(model);
        } catch (error) {
            this.errormessage = error.message ? error.message : error
        }
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
}


export class AgentCtrl extends entityCtrl<any> {
    instances: any[] = [];
    instancelogpodname: string = "";
    instancelog: string = "";
    products: any[] = [{ "stripeprice": "", "name": "Free tier" }];
    packages: any[] = [];
    allpackages: any[] = [];
    images: any[] = [];
    resource: any = null;
    agentcount: number = 0;
    runtime_hours: number = 0;
    currentuser: string = "";
    currentusername: string = "";
    newpackage: any = {"_id": "", "name": "none", "daemon": false};
    newcron: string = "* * * * *"
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $sce: ng.ISCEService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $sce, $interval, WebSocketClientService, api, userdata);
        console.debug("AgentCtrl");
        this.collection = "agents";
        this.postloadData = this.processData;
        WebSocketClientService.onSignedin(async (user: TokenUser) => {
            this.currentuser = user._id;
            this.currentusername = user.name;
            // var products = await NoderedUtil.Query({ collectionname: "config", query: { _type: "resource", "name": "Nodered Instance" }, top: 1 });
            var products = await NoderedUtil.Query({ collectionname: "config", query: { _type: "resource", "name": "Agent Instance" }, top: 1 });
            // this.allpackages = await NoderedUtil.Query({ collectionname: "agents", query: { "_type": "package", "daemon": true } });
            if (products.length > 0) {
                this.resource = products[0];
                if (this.resource.defaultmetadata) {
                    if (this.resource.defaultmetadata.agentcount != null && this.resource.defaultmetadata.agentcount != "") {
                        this.agentcount = parseInt(this.resource.defaultmetadata.agentcount);
                    }
                    if (this.resource.defaultmetadata.runtime_hours != null && this.resource.defaultmetadata.runtime_hours != "") {
                        this.runtime_hours = parseInt(this.resource.defaultmetadata.runtime_hours);
                    }
                }
                this.products = this.products.concat(products[0].products);
            }
            this.images = this.WebSocketClientService.agent_images;

            if (this.id !== null && this.id !== undefined) {
                await this.loadData();
            } else {
                this.model = new Role();
                this.model._type = "agent";
                this.model.name = this.randomname();
                // @ts-ignore
                this.model.image = this.images[0].image;
                // @ts-ignore
                this.model.slug = this.model.name; this.model.stripeprice = ""
                this.model.schedules = [];
                this.ImageUpdated()
                this.loading = false;
                this.model.runas = user._id;
                this.model.runasname = user.name;
                this.model.docker = true;
                this.model.environment = {}
                this.searchtext = user.name;
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
                this.RunasUpdated();
            }
        });
    }
    refreshtimer: any;
    async processData(): Promise<void> {
        if (this.model.stripeprice == null) this.model.stripeprice = "";
        if ( this.model.schedules == null) this.model.schedules = [];
        if(this.model.environment == null) this.model.environment = {}
        
        // v1.5 to 1.5.1 upgrade, hack
        if(this.model.package != null && this.model.package != ""){
            var p = this.allpackages.find(x=>x._id == this.model.package)
            delete this.model.package;
            if(p != null) {
                this.model.schedules.push({"packageid": p._id, "name": p.name, "cron": "", "enabled": true, "env": {}})
            }            
        } 
        this.searchtext = this.model.runasname
        this.ImageUpdated();
        this.RunasUpdated();
        this.loadInstances()
    }
    async RunasUpdated() {
        let queryas = undefined;
        if(this.model != null && this.model.runas != null) {
            queryas = this.model.runas;
        }
        console.log("RunasUpdated queryas:", queryas)
        this.allpackages = await NoderedUtil.Query({ collectionname: "agents", query: { "_type": "package" }, queryas });
        console.log("newpackage", this.newpackage);
        if (this.model?.languages == null || this.model?.languages.length == 0) {
            this.packages = [];
        } else {
            this.packages = this.allpackages.filter(x => this.model.languages.indexOf(x.language) > -1)
            if (!this.model.haschromium && !this.model.haschrome) {
                this.packages = this.packages.filter(x => x.chrome != true && x.chromium != true)
            }
        }
        if(this.newpackage != null) {
            var exists = this.packages.find(x=>x._id == this.newpackage._id);
            if(exists == null) {
                this.newpackage = null;
            }
        }
        if(this.newpackage == null || this.newpackage._id == "") {
            if(this.packages.length > 0){
                this.newpackage = this.packages[0];
            } else {
                this.newpackage = null;
            }
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    async getStatus(model) {
        this.instances = await NoderedUtil.CustomCommand({ command: "getagentpods", id: this.model._id, name: this.model.slug })
        // this.instances =  await NoderedUtil.CustomCommand({command:"getagentpods", id:model._id})
        for (var x = 0; x < this.instances.length; x++) {
            var instance = this.instances[x]
            instance.showstatus = "unknown"
            if (instance.status && instance.status.phase) {
                instance.showstatus = instance.status.phase;
            }
            if (instance.showstatus == "running" || instance.showstatus == "Running") {
                if (instance.status != null && instance.status.containerStatuses != null && instance.status.containerStatuses.length > 0) {
                    // instance.showstatus = instance.status.containerStatuses[0].state.running ? "running" : "stopped";
                    instance.showstatus = instance.status.containerStatuses[0].started ? "Running" : "Stopped " + instance.status.containerStatuses[0].state.waiting.reason;
                }
            }
            if (instance.metadata.deletionTimestamp) instance.showstatus = "Deleting"
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    sizewarningtitle: string = "";
    sizewarning: string = "";
    PlanUpdated() {
        this.sizewarningtitle = ""
        this.sizewarning = ""
        if (this.resource == null || this.products == null || this.products.length < 2) return; // no plans, don't care
        var product = this.products.find(x => x.stripeprice == this.model.stripeprice)
        if (product.stripeprice == "") product = null
        var ram = product?.metadata?.resources?.limits?.memory;
        if (ram == null) {
            ram = product?.metadata?.resources?.requests?.memory;
        }
        if (ram == null) {
            ram = this.resource?.defaultmetadata?.resources?.limits?.memory;
        }
        if (ram == null) {
            ram = this.resource?.defaultmetadata?.resources?.requests?.memory;
        }

        if (ram == null) ram = "128Mi";
        if (ram.indexOf("Mi") > -1) {
            ram = ram.replace("Mi", "")
            ram = parseInt(ram) / 1024;
        } else if (ram.indexOf("Gi") > -1) {
            ram = ram.replace("Gi", "")
            ram = parseInt(ram);
        }
        if (this.model.image == null) return;
        if (this.model.image.indexOf("openiap/nodechromiumagent") > -1) {
            if (product == null || ram < 0.25) {
                this.sizewarningtitle = "Not enough ram"
                if (this.WebSocketClientService.stripe_api_key != null && this.WebSocketClientService.stripe_api_key != "") {
                    this.sizewarning = "This instance will not start, or will run ekstremly slow if not assigned a Payed plan with at least 256Mi ram or higher"
                } else {
                    this.sizewarning = "This instance will not start, or will run ekstremly slow if not assigned a plan with at least 256Mi ram or higher"
                }
            }
        }
        if (this.model.image.indexOf("openiap/pychromiumagent") > -1) {
            if (product == null || ram < 0.25) {
                this.sizewarningtitle = "Not enough ram"
                if (this.WebSocketClientService.stripe_api_key != null && this.WebSocketClientService.stripe_api_key != "") {
                    this.sizewarning = "This instance will not start, or will run ekstremly slow if not assigned a Payed plan with at least 256Mi ram or higher"
                } else {
                    this.sizewarning = "This instance will not start, or will run ekstremly slow if not assigned a plan with at least 256Mi ram or higher"
                }
            }
        }
    }
    async ImageUpdated() {
        this.sizewarningtitle = ""
        this.sizewarning = ""

        var image = this.images.find(x => x.image == this.model.image)
        var languages = this.model.languages;
        if (image != null && image.languages != null && image.languages.length > 0) {
            languages = image.languages;
        }
        var haschromium = false
        var haschrome = false
        if (image != null && image.chromium == true) {
            haschromium = true
        }
        if (image != null && image.chrome == true) {
            haschrome = true
        }
        this.RunasUpdated() // update packages list
        if (!this.$scope.$$phase) { this.$scope.$apply(); }

        if (this.model._id != null && this.model._id != "") {
            this.PlanUpdated()
            return;
        }
        var image = this.images.find(x => x.image == this.model.image)
        if (this.model.port != null && this.model.port != "") {
            this.model.webserver = true;
        } else {
            this.model.webserver = (image.port != null && image.port != "");
        }
        if (this.model.image.indexOf("openiap/nodeagent") > -1) {
            // "gitrepo": "https://github.com/openiap/nodeworkitemagent.git",
            this.model.environment = {
            }
        }
        if (this.model.image.indexOf("openiap/noderedagent") > -1) {
            this.model.environment = {
                "nodered_id": this.model.slug,
                "admin_role": "users",
                "api_role": ""
            }
            // try {
            //     var name = WebSocketClient.instance.user.username.toLowerCase();
            //     name = name.replace(/([^a-z0-9]+){1,63}/gi, "");
            //     this.model.environment["old_nodered_id"] = name;
            // } catch (error) {
            // }
        }
        if (this.model.image.indexOf("openiap/nodechromiumagent") > -1) {
            // "gitrepo": "https://github.com/openiap/nodepuppeteeragent.git",
            this.model.environment = {
            }
            this.PlanUpdated()
        }
        if (this.model.image.indexOf("openiap/dotnetagent") > -1) {
            // "gitrepo": "https://github.com/openiap/dotnetworkitemagent.git",
            this.model.environment = {
            }
        }
        if (this.model.image.indexOf("openiap/pyagent") > -1) {
            // "gitrepo": "https://github.com/openiap/pyworkitemagent.git",
            this.model.environment = {
            }
        }
        if (this.model.image.indexOf("openiap/pychromiumagent") > -1) {
            // "gitrepo3": "https://github.com/openiap/rccworkitemagent.git",
            // "gitrepo2": "https://github.com/openiap/robotframeworkagent.git",
            // "gitrepo": "https://github.com/openiap/taguiagent.git",
            this.model.environment = {
            }
            this.PlanUpdated()
        }
        if (this.model.image.indexOf("openiap/grafana") > -1) {
            this.model.environment = {
                "GF_AUTH_GENERIC_OAUTH_ROLE_ATTRIBUTE_PATH": "contains(roles[*], 'users') && 'Admin'"
            }
            this.PlanUpdated()
        }
        if (this.model.image.indexOf("elsaworkflow") > -1) {
            var url = window.location.protocol + "//" + this.WebSocketClientService.agent_domain_schema.replace("$slug$", this.model.slug);
            this.model.environment = {
                "ELSA__SERVER__BASEURL": url
            }
            this.PlanUpdated()
        }
    }
    async loadInstances() {
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
        if (!this.refreshtimer) {
            // this.loading = true;
            // this.instances =  await NoderedUtil.CustomCommand({command:"getagentpods", id:this.model._id, name:this.model.slug})
            this.getStatus(this.model)
            this.loading = false;
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
            this.refreshtimer = setTimeout(() => {
                this.refreshtimer = null;
                var path = this.$location.path();
                if (path == null && path == undefined) {  return false; }
                if (!path.toLowerCase().startsWith("/agent/") && path.toLowerCase() != "/agent") { return false; }
                this.loadInstances();
            }, 2000);
        }
    }
    random(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min)
    }
    Adjectives = [
        'aged', 'ancient', 'autumn', 'billowing', 'bitter', 'black', 'blue', 'bold',
        'broad', 'broken', 'calm', 'cold', 'cool', 'crimson', 'curly', 'damp',
        'dark', 'dawn', 'delicate', 'divine', 'dry', 'empty', 'falling', 'fancy',
        'flat', 'floral', 'fragrant', 'frosty', 'gentle', 'green', 'hidden', 'holy',
        'icy', 'jolly', 'late', 'lingering', 'little', 'lively', 'long', 'lucky',
        'misty', 'morning', 'muddy', 'mute', 'nameless', 'noisy', 'odd', 'old',
        'orange', 'patient', 'plain', 'polished', 'proud', 'purple', 'quiet', 'rapid',
        'raspy', 'red', 'restless', 'rough', 'round', 'royal', 'shiny', 'shrill',
        'shy', 'silent', 'small', 'snowy', 'soft', 'solitary', 'sparkling', 'spring',
        'square', 'steep', 'still', 'summer', 'super', 'sweet', 'throbbing', 'tight',
        'tiny', 'twilight', 'wandering', 'weathered', 'white', 'wild', 'winter', 'wispy',
        'withered', 'yellow', 'young'
    ]

    Nouns = [
        'art', 'band', 'bar', 'base', 'bird', 'block', 'boat', 'bonus',
        'bread', 'breeze', 'brook', 'bush', 'butterfly', 'cake', 'cell', 'cherry',
        'cloud', 'credit', 'darkness', 'dawn', 'dew', 'disk', 'dream', 'dust',
        'feather', 'field', 'fire', 'firefly', 'flower', 'fog', 'forest', 'frog',
        'frost', 'glade', 'glitter', 'grass', 'hall', 'hat', 'haze', 'heart',
        'hill', 'king', 'lab', 'lake', 'leaf', 'limit', 'math', 'meadow',
        'mode', 'moon', 'morning', 'mountain', 'mouse', 'mud', 'night', 'paper',
        'pine', 'poetry', 'pond', 'queen', 'rain', 'recipe', 'resonance', 'rice',
        'river', 'salad', 'scene', 'sea', 'shadow', 'shape', 'silence', 'sky',
        'smoke', 'snow', 'snowflake', 'sound', 'star', 'sun', 'sun', 'sunset',
        'surf', 'term', 'thunder', 'tooth', 'tree', 'truth', 'union', 'unit',
        'violet', 'voice', 'water', 'waterfall', 'wave', 'wildflower', 'wind', 'wood'
    ]
    tokenChars = '0123456789abcdef'
    randomname() {
        let token = ''
        for (let i = 0; i < 4; i++) {
            token += this.tokenChars[this.random(0, this.tokenChars.length - 1)]
        }
        return this.Adjectives[this.random(0, this.Adjectives.length - 1)] + "-" +
            this.Nouns[this.random(0, this.Nouns.length - 1)] + "-" + token;
    }
    async DeleteAgent(): Promise<void> {
        try {
            this.loading = true;
            this.errormessage = "";
            this.instancelog = "";
            await NoderedUtil.CustomCommand({ command: "deleteagent", id: this.model._id, name: this.model.slug })
        } catch (error) {
            this.errormessage = error.message ? error.message : error
        }
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    async DeleteAgentPod(podname: string): Promise<void> {
        try {
            this.loading = true;
            this.errormessage = "";
            this.instancelog = "";
            await NoderedUtil.CustomCommand({ command: "deleteagentpod", id: this.model._id, name: podname })
            this.loadInstances()
        } catch (error) {
            this.errormessage = error.message ? error.message : error
        }
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    async StopAgent(): Promise<void> {
        try {
            this.loading = true;
            this.errormessage = "";
            this.instancelog = "";
            await NoderedUtil.CustomCommand({ command: "stopagent", id: this.model._id, name: this.model.slug })
            this.loadInstances()
        } catch (error) {
            this.errormessage = error.message ? error.message : error
        }
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    async StartAgent(): Promise<void> {
        try {
            this.loading = true;
            this.errormessage = "";
            this.instancelog = "";
            await NoderedUtil.CustomCommand({ command: "startagent", id: this.model._id, name: this.model.slug })
            this.loadInstances()
        } catch (error) {
            this.errormessage = error.message ? error.message : error
        }
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    async GetInstanceLog(podname: string): Promise<void> {
        try {
            this.loading = true;
            this.instancelogpodname = podname;
            var lines:any = await NoderedUtil.CustomCommand({ command: "getagentlog", id: this.model._id, name: podname });
            if(lines != null) {
                lines = ansi_up.ansi_to_html(lines);
                lines = lines.split("\n") 
                // reverse lines
                lines = lines.reverse()
            } else {
                lines = [];
            }
            this.instancelog = this.$sce.trustAsHtml(lines.join("\n"));
            this.errormessage = "";
        } catch (error) {
            this.errormessage = error.message ? error.message : error
            this.instancelog = "";
        }
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    isdaemon(packageid) {
        var p = this.allpackages.find(x => x._id == packageid)
        if(p == null) return false;
        return p.daemon;
    }
    addpackage() {
        if(this.newpackage == null) return;
        if(this.newpackage._id == "") return;
        var cron = this.newcron;
        if(this.newpackage.daemon == true) cron = "";
        var nameexists = this.model.schedules.find(x => x.name == this.newpackage.name)
        const schedule = {
            name: this.newpackage.name,
            packageid: this.newpackage._id,
            enabled: true,
            allowConcurrentRuns: true,
            terminateIfRunning: false,
            cron,
            "env": {}
        }
        if(nameexists != null) {
            schedule.name = this.newpackage.name + "_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
            return;
        }
        this.model.schedules.push(schedule)
        this.newcron = "* * * * *"
    }
    removepackage(schedule) {
        var index = this.model.schedules.indexOf(schedule);
        if (index > -1) {
            this.model.schedules.splice(index, 1);
        }
    }
    async submit(): Promise<void> {
        try {
            this.loading = true;
            if (!this.$scope.$$phase) { this.$scope.$apply(); }

            var image = this.images.find(x => x.image == this.model.image)
            if (image != null) {
                if (this.model.stripeprice == null || this.model.stripeprice == "") {
                    if (this.model._id == null || this.model._id == "") {
                        this.model.webserver = (image.port != null && image.port != "");
                        if (this.model.webserver == true) {
                            this.model.port = image.port;
                        }
                    }
                    // } else if (this.model.port == null || this.model.port == "") {
                } else if (image.port == null || image.port == "") {
                    if (this.model._id == null || this.model._id == "") {
                        this.model.webserver = false;
                    }
                } else {
                    if (image.port != null && image.port != "") {
                        this.model.port = image.port;
                    }
                }
            }
            var _package = this.packages.find(x => x._id == this.model.package);
            if (_package != null) {
                if (_package.port != null && _package.port != "") {
                    if (this.model._id == null || this.model._id == "") {
                        this.model.webserver = true;
                    }
                    this.model.port = image.port;
                }
            }

            if (image != null && image.volumes != null && image.volumes.length > 0) {
                this.model.volumes = image.volumes;
            }
            if (image != null && image != "") {
                this.model.docker = true;
            }
            if(this.model.schedules == null) this.model.schedules = [];
            var schedulenames = this.model.schedules.map(x => x.name);
            // does schedulenames has doubles?
            var doubles = schedulenames.filter((item, index) => schedulenames.indexOf(item) != index)
            if(doubles.length > 0) {
                this.errormessage = "Schedule names must be unique"
                return;
            }
            if (this.model._id) {
                await NoderedUtil.UpdateOne({ collectionname: this.collection, item: this.model });
                if(this.instances.length == 0 && this.model.image != null && this.model.image != "") {
                    await NoderedUtil.CustomCommand({ command: "startagent", id: this.model._id, name: this.model.slug })
                }
            } else {
                var tmp = await NoderedUtil.InsertOne({ collectionname: this.collection, item: this.model });
                if (this.model) {
                    this.model = tmp;
                    this.id = this.model._id
                    this.basequery = { _id: this.id };
                    await NoderedUtil.CustomCommand({ command: "startagent", id: this.model._id, name: this.model.slug })
                }
                this.$location.path("/Agent/" + this.id);
            }
            this.loading = false;
            if (this.model) { this.loadData(); }
        } catch (error) {
            console.error(error);
            this.errormessage = error.message ? error.message : error;
        }
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }


    searchFilteredList: Role[] = [];
    searchSelectedItem: Role = null;
    searchtext: string = "";
    e: any = null;

    restrictInput(e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            return false;
        }
    }
    setkey(e) {
        this.e = e;
        this.handlekeys();
    }
    handlekeys() {
        if (this.searchFilteredList.length > 0) {
            let idx: number = -1;
            for (let i = 0; i < this.searchFilteredList.length; i++) {
                if (this.searchSelectedItem != null) {
                    if (this.searchFilteredList[i]._id == this.searchSelectedItem._id) {
                        idx = i;
                    }
                }
            }
            if (this.e.keyCode == 38) { // up
                if (idx <= 0) {
                    idx = 0;
                } else { idx--; }
                // this.searchtext = this.searchFilteredList[idx].name;
                this.searchSelectedItem = this.searchFilteredList[idx];
                return;
            }
            else if (this.e.keyCode == 40) { // down
                if (idx >= this.searchFilteredList.length) {
                    idx = this.searchFilteredList.length - 1;
                } else { idx++; }
                // this.searchtext = this.searchFilteredList[idx].name;
                this.searchSelectedItem = this.searchFilteredList[idx];
                return;
            } else if (this.e.keyCode == 13) { // enter
                if (idx >= 0) {
                    this.searchtext = this.searchFilteredList[idx].name;
                    this.searchSelectedItem = this.searchFilteredList[idx];
                    if (this.searchSelectedItem != null) {
                        this.model.runasname = this.searchSelectedItem.name
                        this.model.runas = this.searchSelectedItem._id
                    }
                    this.searchFilteredList = [];
                    if (!this.$scope.$$phase) { this.$scope.$apply(); }                    
                }
                return;
            } else if (this.e.keyCode == 27) { // esc
                this.searchtext = this.model.runasname;
                this.searchFilteredList = [];
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
            }
        } else {
            if (this.e.keyCode == 13 && this.searchSelectedItem != null) {
                // this.AddMember(this.searchSelectedItem);
                this.model.runasname = this.searchSelectedItem.name
                this.model.runas = this.searchSelectedItem._id
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
            }
        }
    }
    async handlefilter(e) {
        this.e = e;

        this.searchFilteredList = await NoderedUtil.Query({
            collectionname: "users",
            query: {
                _type: "user",
                name: this.searchtext
            }
            , orderby: { _type: -1, name: 1 }, top: 2
        });
        this.searchFilteredList = this.searchFilteredList.concat(await NoderedUtil.Query({
            collectionname: "users",
            query: {
                _type: "user",
                "$or": [
                    { name: new RegExp([this.searchtext].join(""), "i") },
                    { email: new RegExp([this.searchtext].join(""), "i") },
                    { username: new RegExp([this.searchtext].join(""), "i") }
                ]

            }
            , orderby: { _type: -1, name: 1 }, top: 5
        }));
        // this.searchFilteredList = await NoderedUtil.Query("users",
        //     {
        //         $and: [
        //             { $or: [{ _type: "user" }, { _type: "role" }] },
        //             { name: new RegExp([this.searchtext].join(""), "i") },
        //             { _id: { $nin: ids } }
        //         ]
        //     }
        //     , null, { _type: -1, name: 1 }, 8, 0, null);
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    fillTextbox(searchtext) {
        this.searchFilteredList.forEach((item: any) => {
            if (item.name.toLowerCase() == searchtext.toLowerCase()) {
                this.searchtext = item.name;
                this.searchSelectedItem = item;
                this.model.runasname = this.searchSelectedItem.name
                this.model.runas = this.searchSelectedItem._id
                this.searchFilteredList = [];
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
            }
        });
    }

}


export class PackagesCtrl extends entitiesCtrl<Base> {
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $interval, WebSocketClientService, api, userdata);
        this.autorefresh = true;
        console.debug("PackagesCtrl");
        this.basequery = { _type: "package" };
        this.collection = "agents";
        this.postloadData = this.processdata;
        this.skipcustomerfilter = true;
        this.searchfields = ["name", "languages"];
        this.baseprojection = { _type: 1, name: 1, _created: 1, _modified: 1, language: 1, _createdby: 1 };
        if (this.userdata.data.PackagesCtrl) {
            this.basequery = this.userdata.data.PackagesCtrl.basequery;
            this.collection = this.userdata.data.PackagesCtrl.collection;
            this.baseprojection = this.userdata.data.PackagesCtrl.baseprojection;
            this.orderby = this.userdata.data.PackagesCtrl.orderby;
            this.searchstring = this.userdata.data.PackagesCtrl.searchstring;
            this.basequeryas = this.userdata.data.PackagesCtrl.basequeryas;
            this.skipcustomerfilter = this.userdata.data.PackagesCtrl.skipcustomerfilter;
        }
        WebSocketClientService.onSignedin((user: TokenUser) => {
            this.loadData();
        });
    }
    async processdata() {
        if (!this.userdata.data.PackagesCtrl) this.userdata.data.PackagesCtrl = {};
        this.userdata.data.PackagesCtrl.basequery = this.basequery;
        this.userdata.data.PackagesCtrl.collection = this.collection;
        this.userdata.data.PackagesCtrl.baseprojection = this.baseprojection;
        this.userdata.data.PackagesCtrl.orderby = this.orderby;
        this.userdata.data.PackagesCtrl.searchstring = this.searchstring;
        this.userdata.data.PackagesCtrl.basequeryas = this.basequeryas;
        this.userdata.data.PackagesCtrl.skipcustomerfilter = this.skipcustomerfilter;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    async DeletePackage(model: any): Promise<void> {
        try {
            this.loading = true;
            this.errormessage = "";
            await NoderedUtil.CustomCommand({ command: "deletepackage", id: model._id })
            this.loading = false;
            setTimeout(this.loadData.bind(this), 500)
        } catch (error) {
            this.errormessage = error.message ? error.message : error

        }
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
}

export class PackageCtrl extends entityCtrl<Base> {
    e: any = null;
    languages: string[] = ["nodejs", "python", "dotnet", "powershell"];
    oldfileid: string = "";
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $sce: ng.ISCEService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $sce, $interval, WebSocketClientService, api, userdata);
        console.debug("PackageCtrl");
        this.collection = "agents";
        WebSocketClientService.onSignedin(async (user: TokenUser) => {
            if (this.id !== null && this.id !== undefined) {
                await this.loadData();
            } else {
                this.model = new Base();
                this.model._type = "package";
                // @ts-ignore
                this.model.language = "nodejs";
                // @ts-ignore
                this.model.fileid = "";
            }
        });
    }
    async submit(): Promise<void> {
        try {
            await this.Upload()
            // @ts-ignore
            if (this.model.fileid == null || this.model.fileid == "") {
                throw new Error("File is required")
            }
            if (this.model._id) {
                await NoderedUtil.UpdateOne({ collectionname: this.collection, item: this.model });
            } else {
                this.model = await NoderedUtil.InsertOne({ collectionname: this.collection, item: this.model });
            }
            // if(this.oldfileid != "" && this.oldfileid != null) {
            //     try {
            //         await NoderedUtil.DeleteOne({ collectionname: "files", id: this.oldfileid });
            //     } catch (error) {
            //     }
            // }
            this.$location.path("/Packages");
        } catch (error) {
            console.error(error);
            this.errormessage = error.message ? error.message : error;
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    toBase64(file) {
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as any);
            reader.onerror = error => reject(error);
        });
    }
    async Upload() {
        try {
            const e: any = document.getElementById('fileupload')
            // const buffer = new Uint8Array(await e.files[0].arrayBuffer())
            if (e.files && e.files.length > 0) {
                let buffer: string = await this.toBase64(e.files[0])
                if (buffer != null) {
                    buffer = buffer.split(",")[1]
                }
                const mimeType = e.files[0].type
                const filename = e.files[0].name
                // @ts-ignore
                var result = await NoderedUtil.SaveFile({ filename, mimeType, file: buffer, compressed: false, metadata: { _type: "package" } });
                // @ts-ignore
                this.oldfileid = this.model.fileid;
                // @ts-ignore
                this.model.fileid = result.id;
                e.value = null;
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
            }

        } catch (error) {
            console.error(error);
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }

}

export class RunPackageCtrl extends entityCtrl<Base> {
    e: any = null;
    languages: string[] = ["nodejs", "python", "dotnet", "powershell"];
    oldfileid: string = "";
    packageid: string = "";
    package: string = "";
    agents: any[] = [];
    packages: any[] = [];
    allpackages: any[] = [];
    re_addcommandstream: any = null;
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $sce: ng.ISCEService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $sce, $interval, WebSocketClientService, api, userdata);
        console.debug("RunPackageCtrl");
        this.collection = "agents";
        this.postloadData = this.processData.bind(this);
        WebSocketClientService.onSignedin(async (user: TokenUser) => {
            this.queuename = "";
            this.packageid = $routeParams.packageid;
    
            if (this.id !== null && this.id !== undefined) {
                await this.loadData();
            } else {
                await this.processData();
            }
        });
    }
    firstlist: boolean = true;
    async processData() {
        if (this.id !== null && this.id !== undefined) {
            this.agents = await NoderedUtil.Query({ collectionname: "agents", query: { _id: this.id } });
            var temp = await NoderedUtil.Query({ collectionname: "agents", query: { _type: "agent", _id: {"$nin": [this.id]}, languages: {"$exists": true} }, top:100 });
            this.agents = this.agents.concat(temp);
        } else {
            this.agents = await NoderedUtil.Query({ collectionname: "agents", query: { _type: "agent", languages: {"$exists": true} }, top:100 });
        }
        var queryas = undefined;
        if(this.agents.length > 0) {
            queryas = this.agents[0].runas;
        }
        console.log("queryas", queryas)
        this.allpackages = await NoderedUtil.Query({ collectionname: "agents", query: { _type: "package" }, top:100, queryas });

        if (!this.$scope.$$phase) { this.$scope.$apply(); }
        await this.RegisterQueue();
        this.AgentUpdated()
        if (!this.$scope.$$phase) { this.$scope.$apply(); }

        var _a = this.agents.find(x => x._id == this.id);
        console.log("send message to " + _a.slug )
        const streamid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        try {
            this.firstlist = true;
            var processes = await NoderedUtil.Queue({ data: {"command": "listprocesses"}, queuename: _a.slug + "agent", correlationId: streamid,replyto: this.queuename })

            this.re_addcommandstream = this.$interval(() => {
                NoderedUtil.Queue({ data: {"command": "addcommandstreamid"}, queuename: _a.slug + "agent", correlationId: streamid,replyto: this.queuename }).catch((error) => {
                    console.error(error);
                    this.errormessage = error.message ? error.message : error
                }).then(() => {
                    console.debug("Keep " + this.queuename + " in commandqueue on " + _a.slug + "agent")
                }).catch((error) => {
                    this.errormessage = error.message ? error.message : error
                });
            }, 10000);
            this.$scope.$on('$destroy', () => {
                this.$interval.cancel(this.re_addcommandstream);
                console.debug("removing streamid from " + _a.slug + "agent")
                NoderedUtil.Queue({ data: {"command": "removecommandstreamid"}, queuename: _a.slug + "agent", correlationId: streamid,replyto: this.queuename }).catch((error) => {
                    console.error(error);
                    this.errormessage = error.message ? error.message : error
                }).then(() => {
                    console.debug("removed streamid from " + _a.slug + "agent")
                });
            });
        } catch (error) {
            this.errormessage = error.message ? error.message : error            
        }
    }
    haschrome: boolean = false;
    haschromium: boolean = false;
    queuename: string = "";
    async AgentUpdated() {
        this.languages = [];
        var _a = this.agents.find(x => x._id == this.id);
        if (_a == null) return;
        this.languages = _a.languages;
        this.haschrome = (_a.chrome == true)
        this.haschromium = (_a.chromium == true)

        this.packages = this.allpackages.filter(x => this.languages.indexOf(x.language) > -1)
        if (!this.haschromium && !this.haschrome) {
            this.packages = this.packages.filter(x => x.chrome != true && x.chromium != true)
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    async addprocess(streamid:string, setstream: boolean, schedulename:string = undefined): Promise<void> {
        try {
            var _a = this.agents.find(x => x._id == this.id);
            if (_a == null) return;
            var pretest = document.getElementById(streamid);
            if(pretest != null) return;

            var payload ={
                "command": "setstreamid",
                "id": streamid,
                "streamqueue": this.queuename
            }
            var div = document.createElement("div");
            div.id = streamid + "_div";
            div.classList.add("shadow"); div.classList.add("card");
            var label = document.createElement("label");
            label.innerText = "Stream " + streamid;
            if(schedulename != null) {
                label.innerText = schedulename + " (#" + streamid + ")";
            }
            div.appendChild(label);
            const togglebutton = document.createElement("button");
            togglebutton.id = "toggle" + streamid;
            togglebutton.innerText = "toggle";
            togglebutton.onclick = function () {
                pre.classList.toggle('collapsed');
                pre.classList.toggle('expanded');
                if (pre.classList.contains('collapsed')) {
                    pre.style.height = '100px'; // height for 4 lines
                } else {
                    pre.style.height = 'auto'; // show everything
                }
            }
            div.appendChild(togglebutton);
            var killbutton = document.createElement("button");
            killbutton.innerText = "Kill";
            killbutton.id = streamid + "_kill";
            killbutton.onclick = async () => {
                try {
                    await NoderedUtil.Queue({ data: { command: "kill", "id": streamid }, queuename: _a.slug + "agent", correlationId: streamid })
                } catch (error) {
                    console.error(error);
                    this.errormessage = error.message ? error.message : error
                }
            }
            div.appendChild(killbutton);
            var pre = document.createElement("pre");
            pre.id = streamid;
            pre.classList.toggle('collapsed');
            // pre.classList.toggle('expanded');
            // pre.style.display = pre.classList.contains('collapsed') ? 'block' : 'none';
            div.appendChild(pre);
            var runs = document.getElementById("runs");
            runs.prepend(div);

            if(setstream == true) await NoderedUtil.Queue({ data: payload, queuename: _a.slug + "agent", correlationId: streamid })
        } catch (error) {
            console.error(error);
            this.errormessage = error.message ? error.message : error
        }
    }
    async Reinstall() : Promise<void> {
        try {
            var _a = this.agents.find(x => x._id == this.id);
            if (_a == null) return;
            const streamid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            var payload ={
                "command": "reinstallpackage",
                "id": this.package,
                "stream": true,
                "queuename": this.queuename
            }
            await NoderedUtil.Queue({ data: payload, queuename: _a.slug + "agent", correlationId: streamid })
        } catch (error) {
            console.error(error);
            this.errormessage = error.message ? error.message : error
        }
    }
    async submit(): Promise<void> {
        try {
            var _a = this.agents.find(x => x._id == this.id);
            if (_a == null) return;
            const streamid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            var payload ={
                "command": "runpackage",
                "id": this.package,
                "stream": true,
                "queuename": this.queuename
            }
            await NoderedUtil.Queue({ data: payload, queuename: _a.slug + "agent", correlationId: streamid })
        } catch (error) {
            console.error(error);
            this.errormessage = error.message ? error.message : error
        }
    }
    async RegisterQueue() {
        if(this.queuename != "") return;
        this.queuename = await NoderedUtil.RegisterQueue({
            callback: (_data: QueueMessage, ack: any) => {
                ack();
                if(_data == null) return;
                var correlationId = _data.correlationId;
                var data: any = _data;
                while(data.data != null && data.data != "") data = data.data;
                if(data.command == "listprocesses") {
                    for(var i = 0; i < data.processes.length; i++) {
                        this.addprocess(data.processes[i].id, this.firstlist, data.processes[i].schedulename);
                    }
                    this.firstlist = false;
                }
                if(data.command == "runpackage" && data.completed == true && data.success == false) {
                    var pre = document.getElementById(correlationId);
                    if(pre == null) {
                        this.addprocess(correlationId, false);
                        pre = document.getElementById(correlationId);
                    }
                    var killbutton = document.getElementById(correlationId + "_kill");
                    if(killbutton != null) killbutton.remove();
                    pre.innerHTML = data.error + pre.innerHTML;
                }
                if(data.command == "completed" || (data.command == "runpackage" && data.completed == true)) {
                    var killbutton = document.getElementById(correlationId + "_kill");
                    if(killbutton != null) killbutton.remove();
                    return;
                }
                if(data.command == null) {
                    var pre = document.getElementById(correlationId);
                    if(pre == null) {
                        this.addprocess(correlationId, false);
                        pre = document.getElementById(correlationId);
                    }
                    // if(pre == null) return;
                    const decoder = new TextDecoder("utf-8");
                    const _string = decoder.decode(new Uint8Array(data as any));
                    const string = ansi_up.ansi_to_html(_string);
                    var strings = string.split("\n").reverse();

                    pre.innerHTML = strings.join("<br/>") + pre.innerHTML;
                    // pre.innerText = strings.join("\n") + pre.innerText;
                }
                if (!this.$scope.$$phase) { this.$scope.$apply(); }

            }, closedcallback: (msg) => {
                this.queuename = "";
                setTimeout(this.RegisterQueue.bind(this), (Math.floor(Math.random() * 6) + 1) * 500);
            }
        });
        try {
            var _a = this.agents.find(x => x._id == this.id);
            await NoderedUtil.Queue({ data: {"command": "addcommandstreamid"}, queuename: _a.slug + "agent" });
        } catch (error) {
            console.error(error);
            this.errormessage = error.message ? error.message : error
        }
    }
}

export class QueryCtrl {
    public queuename: string = "";
    public pipeline: string = "";
    public model: any = null;
    public models: any[] = [];
    public collections: any[] = [];
    public keys: string[] = [];
    public collection: string = "";
    public searchstring: string = "";
    public reasoning: string = "";
    public errormessage: string = "";
    public errorcount: number = 0;
    public loadingollama: boolean = false;
    public loadingdata: boolean = false;
    
    public static $inject = [
        "$rootScope",
        "$scope",
        "$location",
        "$routeParams",
        "$interval",
        "WebSocketClientService",
        "api",
        "userdata"
    ];
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        console.debug("QueryCtrl");
        console.log(WebSocketClientService.llmchat_queue);
        this.collection = $routeParams.collection;
        if(this.collection == null || this.collection == "") {
            this.collection = "entities";
        }
        this.$scope.$on('search', (event, data) => {
            this.searchstring = data;
        });
        WebSocketClientService.onSignedin(async (user: TokenUser) => {
            this.collections = await NoderedUtil.ListCollections({});
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
            await this.RegisterQueue();
            this.$scope.$on('signin', async (event, data) => {
                this.collections = await NoderedUtil.ListCollections({});
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
                this.RegisterQueue();
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
            });
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
        });
    }
    SelectCollection() {
        // if (!this.userdata.data.EntitiesCtrl) this.userdata.data.EntitiesCtrl = {};
        // this.userdata.data.EntitiesCtrl.collection = this.collection;
        this.$location.path("/Query/" + this.collection);
        this.searchstring = "";
        this.errormessage = "";
        this.pipeline = "";
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
        // this.loadData();
    }
    private lastsearch = "";
    private messages: chatmessage[] = [];
    async Search() {
        this.$rootScope.$broadcast("search", this.searchstring);
        if(this.searchstring == null || this.searchstring.trim() == "") return;
        if(this.lastsearch != this.searchstring) {
            this.errormessage = "";
            this.pipeline = "";
            this.lastsearch = this.searchstring
        }
        if(this.errorcount > 3) {
            this.errormessage = "Too many errors, please rephrase your question\n" + this.errormessage;
            this.errorcount = 0;
            return;
        }
        if(this.errormessage.includes("Too many errors")) {
            this.errormessage = "";
            this.pipeline = "";
        }
        this.loadingollama = true;
        if(this.errormessage != "") {
        } else {
            this.errormessage = "";
            this.pipeline = "";
        }
        this.models = [];
        this.keys = [];
        if (!this.$scope.$$phase) { this.$scope.$apply(); }

        let prompt = "";
        const lastweek = new Date();
        prompt = "Generate mongodb aggregation pipeline, based on the user input, reply with the generated pipeline in json format using syntax `{\"pipeline\": [${pipeline}], \"reasoning\": \"explain why you choose this query\": }`\n" +
        `Today is ${new Date().toISOString()}\n`;

        prompt += 
        `## Formatting Standards for ASCII Tables
        - Standardize column widths and text alignment.
        - Include headers for columns.
        - Handle long text through truncation or wrapping, as appropriate.
        ## Additional Notes
        - Use case-insensitive searches for matching operations.
        - We are creating a query toward a the '${this.collection}' collection`
        if (this.WebSocketClientService.timeseries_collections.indexOf(this.collection) != -1) {
            prompt += ` - '${this.collection}' is a time series collection and has a lot of data, so always use '$group' if there is a chance of returning many results\n`
        }
        prompt += `## object schema
        All objects in the collection have a _type and name property, for instance in openrpa collection, we have "_type": "workflow", "_type": "project" and in users collection we have "_type": "user" "_type": "role" etc.
        - '_created': date field for when created
        - '_createdby': string, with name of user who created this object
        - '_createdbyid': string with the _id of the user who created this object
        - '_modified': date field for when modified
        - '_modifiedby': string, with name of user who modified this object
        - '_modifiedbyid': string with the _id of the user who modified this object
        - '_type': string, with the type of object, for instance 'user', 'role', 'workflow', 'project' etc.
        - 'name': string, with the name of the object`
        // if (this.WebSocketClientService.timeseries_collections.indexOf(this.collection) != -1) {
        // // } else if(this.WebSocketClientService.collections_with_text_index.indexOf(this.collection) != -1) {
        //     prompt += `We are querying the time series collection '${this.collection}' that has a lot of data, so always use aggregates if there is a chance of returning many results\n`
        // } else {
        //     prompt +=  `We are querying the ''${this.collection}' collection. All objects in the collection have a _type and name property, for instance in openrpa collection, we have "_type": "workflow", "_type": "project" and in users collection we have "_type": "user" "_type": "role" etc.\n`
        // }
        // prompt += `All objects have a datatime filed '_created' and '_modified' so decided if you need to use one of those fields. If user asks for all new users created the last week we use "_created": {"$gt": "${lastweek.toISOString()}"} \n` +
        // "Carefully decided if we should use a group by or not\n" +
        // "if user asks you to use type or _type, user most likely mean the field `_type`\n" +
        // "if user asks for created, use field `_created`\n" +
        // "if user asks for modified or updated, use field `_modified`\n" +
        // "IMPORTANT! Never use $loopup. Never remove `_` from field names! \n"
        // "IMPORTANT! Never use $loopup. Never remove _ if field has _ in it\n"
        prompt += "### User prompt: " + this.searchstring; 
        if(this.errormessage != "") {
            console.log("Adding last error and pipeline to prompt")
            this.errorcount++;
            prompt += "### Last Query: " + this.pipeline
            prompt += "### Last Error: " + this.errormessage
            // this.errormessage = "";
            this.pipeline = "";
            if (!this.$scope.$$phase) { this.$scope.$apply(); }

        } else {
        }

        lastweek.setDate(lastweek.getDate() - 7);
        var payload = {
            func: "generate",
            model: "mistral",
            prompt,
            raw: false,
            json: true,
        }
        try {
            const result: any = await NoderedUtil.Queue({ 
                queuename: this.WebSocketClientService.llmchat_queue, replyto: this.queuename, 
                data: payload, 
                 striptoken: true });
        } catch (error) {
            this.errormessage = error.message ? error.message : error;            
        }
    }
    async RunQuery() {
        try {
            let pipeline = null;
            try {
                pipeline = JSON.parse(this.pipeline);
            } catch (error) {
                this.errormessage = error.message ? error.message : error;
                return;
            }
            if(pipeline == null) {
                console.log("pipeline is null")
                return;
            }
            this.loadingdata = true;
            this.models = [];
            this.keys = [];
            this.errormessage = "";
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
    
            this.models = await NoderedUtil.Aggregate({ collectionname: this.collection, 
                aggregates: pipeline
            });
            if(this.models.length > 0) {
                var __keys = Object.keys(this.models[0]);
                var _keys = __keys.filter(x => x != "name" && x.startsWith("_") == false);
    
                if(__keys.includes("_created")) {
                    _keys.unshift("_created");
                }
                if(__keys.includes("_type")) {
                    _keys.unshift("_type");
                }
                if(__keys.includes("name")) {
                    _keys.unshift("name");
                }
                if(__keys.includes("_id")) {
                    _keys.unshift("_id");
                }
                if(_keys.length > 7) {
                    _keys = _keys.slice(0, 7);
                }
                this.keys = _keys;
            }
            if(this.models.length == 0) {
                this.models = [{name: "No results"}]
                this.keys = ["name"]
            }
            this.errorcount = 0;
            this.loadingdata = false
        } catch (error) {
            this.errormessage = error.message ? error.message : error;
        }
        this.loadingdata = false
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    async RegisterQueue() {
        if(this.queuename != "") return;
        this.queuename = await NoderedUtil.RegisterQueue({
            callback: async (_data: QueueMessage, ack: any) => {
                ack();
                try {
                    if(_data == null) return;
                    var correlationId = _data.correlationId;
                    var data: any = _data;
                    if(data.data != null) data = data.data;
                    if(data.error != null && data.error != "") {
                        this.errormessage = data.error;
                        this.loadingollama = false;
                        return;
                    }
                    if(data.func == "generating") {
                        // console.log(data);
                        this.pipeline += data.response;
                    } else if(data.func == "generate") {
                        if(data.response == null || data.response == "") {
                            this.errormessage = "No response from LLM";
                            this.loadingollama = false;
                            return;
                        }
                        try {
                            var pipeline = JSON.parse(data.response);
                            this.pipeline =JSON.stringify(pipeline.pipeline, null, 2);
                            this.reasoning = pipeline.reasoning;
                            this.loadingollama = false
                            this.RunQuery()
                        } catch (error) {
                            this.errormessage = error.message ? error.message : error;
                            this.loadingollama = false;
                            this.errorcount =0;
                            console.log(data.response);
                            console.error(error);                        
                        }
                    } else {
                        console.log(data);
                    }
                } catch (error) {
                    this.errormessage = error.message ? error.message : error;
                    this.loadingollama = false;
                } finally {
                    if (!this.$scope.$$phase) { this.$scope.$apply(); }
                }                
            }, closedcallback: (msg) => {
                this.queuename = "";
                setTimeout(this.RegisterQueue.bind(this), (Math.floor(Math.random() * 6) + 1) * 500);
            }
        });
        console.log("RegisterQueue", this.queuename);
    }
    OpenEntity(model) {
        this.$location.path("/Entity/" + this.collection + "/" + model._id);
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
        return;
    }

}



export class ChatCtrl {
    public queuename: string = "";
    public llmmodel: string = "openai/gpt-3.5-turbo-1106";
    public model: any = null;
    public models: any[] = [];
    public collections: any[] = [];
    public keys: string[] = [];
    public chatmessage: string = "";
    public errormessage: string = "";
    public errorcount: number = 0;
    public loadingollama: boolean = false;
    public loadingdata: boolean = false;
    public starters: string[] = [];
    
    public static $inject = [
        "$sce",
        "$rootScope",
        "$scope",
        "$timeout",
        "$location",
        "$routeParams",
        "$interval",
        "WebSocketClientService",
        "api",
        "userdata"
    ];
    constructor(
        public $sce: ng.ISCEService,
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $timeout: ng.ITimeoutService,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api: api,
        public userdata: userdata
    ) {
        console.debug("QueryCtrl");
        console.log(WebSocketClientService.llmchat_queue);

        this.threadid = $routeParams.threadid;
        if(this.threadid == null) this.threadid = "";

        this.starters = [
            "Find the email of user named macuser",
            "What are the last 20 audit entries ?",
            "list the number of audit entries, grouped by month",
            "get then top 20 OpenRPA workflows grouped by created user",
            "What is the top 10 most run openrpa workflow grouped by name?",
            "What is the top 10 most run openrpa workflow grouped by name, and then write a short story about OpenRPA the happy robot"
        ]
        var _llmmodel = this.getCookie("llmchatmodel");
        if(_llmmodel != null && _llmmodel != "") {
            this.llmmodel = _llmmodel;
        }
        // this.collection = $routeParams.collection;
        WebSocketClientService.onSignedin(async (user: TokenUser) => {
            var workflows = await NoderedUtil.Query({ collectionname: "openrpa", query: { _type: "workflow" }, top:1 });
            var workflow = "WhoAmI";
            var robotuser = user.username;
            if(workflows.length > 0) {
                workflow = workflows[0].name;
            }
            console.log("signed in", user)
            if(user.username == "az") {
                workflow = "WhoAmI";
                robotuser = "macuser"
            }
            this.starters = [
                "Find the email of user named " + user.username,
                "what is the most run openrpa workflow ?",
                "Run `" + workflow + "` on `" + robotuser + "`",
                "What are the last 20 audit entries ?",
                "list the number of audit entries, grouped by month",
                "get then number of OpenRPA workflows grouped by created user",
                "What is the top 10 most run openrpa workflow grouped by name?",
                "What is the top 20 most failed openrpa workflow grouped by name?",
                "What is the top 10 most run openrpa workflow grouped by name, and then write a short story about OpenRPA the happy robot"
            ]
            this.LoadThread();
            this.collections = await NoderedUtil.ListCollections({});
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
            await this.RegisterQueue();
            this.$scope.$on('signin', async (event, data) => {
                this.collections = await NoderedUtil.ListCollections({});
                this.LoadThread();
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
                this.RegisterQueue();
                if (!this.$scope.$$phase) { this.$scope.$apply(); }
            });
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
            this.$timeout(()=> {
                var input = document.getElementById('chatmessage');
                if(input != null && input.focus != null) input.focus();
            }, 200)
        });
        // Watch for changes in your messages array
        $scope.$watchCollection('ctrl.messages', (newMessages: any, oldMessages: any) => {
        if (newMessages.length !== oldMessages.length) {
            $timeout(this.scrollToBottom, 100); // Scroll after the DOM update
        }
    });
    }
    async LoadThread() {
        if(this.threadid != "") {
            var _messages = await NoderedUtil.Query({ collectionname: "llmchat", query: { threadid: this.threadid, "_type": "message" }, top:100 });
            _messages.sort((a, b) => {
                return a.message.index - b.message.index;
             });
            this.messages = _messages.map((x) => x.message);;
            if (!this.$scope.$$phase) { this.$scope.$apply(); }
        }
    }
    Reset() {
        this.errormessage = "";
        this.errorcount = 0;
        this.chatmessage = "";
        this.threadid = "";
        this.toolmessage = null;
        this.messages = [];
        this.models = [];
        this.keys = [];
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    scrollToBottom() {
        var chatContainer = document.querySelector('.chat-container');
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    setCookie(cname, cvalue, exdays) {
        const d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        const expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }
    getCookie(cname) {
        const name = cname + "=";
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }
    private collectionname: string = "";
    private toolmessage:chatmessage = null;
    async runtool(message: any) {
        try {
            this.loadingdata = true;
            this.models = [];
            this.keys = [];
            this.toolmessage = message;
            if (!this.$scope.$$phase) { this.$scope.$apply(); }

            if(message.name == "MongoAggregate") {
                var pipeline = message.pipeline;
                var collectionname = message.collectionname;
                this.collectionname = collectionname;
                if(pipeline != null && collectionname != null) {
                    this.models = await NoderedUtil.Aggregate({ collectionname: message.collectionname, 
                        aggregates: pipeline
                    });
                } else {
                    this.errormessage = message.content;
                }
            } else if(message.name == "MongoQuery") {
                var query = message.query;
                var top = message.top;
                var collectionname = message.collectionname;
                this.collectionname = collectionname;
                var projection = message.projection;
                if(query == null) query = {};
                console.log(collectionname, query, top, projection);
                if(query != null && collectionname != null) {
                    this.models = await NoderedUtil.Query({ collectionname, query, top, projection });
                } else {
                    this.errormessage = message.content;
                }                
            } else if(message.name == "GetCollections") {
                this.models = await NoderedUtil.ListCollections({});
            } else if(message.name == "RunOpenRPAWorkflow") {
                console.log("runtool RunOpenRPAWorkflow", message);
                if(message.correlationId == null || message.correlationId == "") {
                    message.correlationId = NoderedUtil.GetUniqueIdentifier();
                }
                var div = document.getElementById(message.correlationId);
                if(div != null) {
                    div.innerText = "Sending invoke command to " + message.robotid + "\n";
                } else {
                    this.$timeout(()=> {
                        var div = document.getElementById(message.correlationId);
                        if(div != null) {
                            div.innerText = "Sending invoke command to " + message.robotid + "\n";
                        }
                    }, 200);
                }

                const rpacommand = {
                    command: "invoke",
                    workflowid: message.workflowid,
                    data: message.parameters                                        
                }
                await NoderedUtil.Queue({
                    correlationId: message.correlationId,
                    data: rpacommand,
                    queuename: message.robotid,
                    replyto: this.queuename,
                })
            }    
            if(this.models.length > 0) {
                var __keys = Object.keys(this.models[0]);
                var _keys = __keys.filter(x => x != "name" && x.startsWith("_") == false);
    
                if(__keys.includes("_created")) {
                    _keys.unshift("_created");
                }
                if(__keys.includes("_type")) {
                    _keys.unshift("_type");
                }
                if(__keys.includes("name")) {
                    _keys.unshift("name");
                }
                if(__keys.includes("_id")) {
                    _keys.unshift("_id");
                }
                if(_keys.length > 7) {
                    _keys = _keys.slice(0, 7);
                }
                this.keys = _keys;
            }
            if(this.models.length == 0) {
                this.models = [{name: "No results"}]
                this.keys = ["name"]
            }
            this.errorcount = 0;
            this.loadingdata = false
        } catch (error) {
            this.errormessage = error.message ? error.message : error;
        }
        this.$timeout(()=> {
            var table = document.getElementById('table1'); // Adjust the ID if necessary
            table.scrollTop = table.scrollHeight;
        }, 200)

        this.loadingdata = false
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }

    Markdown(text) {
        // @ts-ignore
        var converter = new showdown.Converter(),
        html = converter.makeHtml(text)
        if(html != null) {
            html = html.split("\n").join("<br/>");
        }
        return this.$sce.trustAsHtml(html);
    }

    async Resubmit(message) {
        var index = this.messages.findIndex(x => x == message);
        if(index == -1) return;
        // delete this message and everythig after
        this.messages = this.messages.slice(0, index);
        this.chatmessage = message.content;
        this.Search();
    }

    private lastmessage = "";
    private messages: chatmessage[] = [];
    private threadid: string = "";
    async Search() {
        if(this.chatmessage == null || this.chatmessage.trim() == "") return;
        if(this.lastmessage != this.chatmessage) {
            this.errormessage = "";
            this.lastmessage = this.chatmessage
        }
        if(this.errorcount > 3) {
            this.errormessage = "Too many errors, please rephrase your question\n" + this.errormessage;
            this.errorcount = 0;
            return;
        }
        // if new question was sent, clear error
        if(this.errormessage.includes("Too many errors")) {
            this.errormessage = "";
        }
        this.loadingollama = true;
        if(this.errormessage != "") {
        } else {
            this.errormessage = "";
        }
        this.models = [];
        this.keys = [];
        if (!this.$scope.$$phase) { this.$scope.$apply(); }

        this.setCookie("llmchatmodel", this.llmmodel, 365);

        var payload = {
            func: "chat",
            model: this.llmmodel, 
            // model: "ollama/mistral",
            // model: "ollama/functionary",
            message: this.chatmessage,
            threadid: this.threadid,
            // json: true,
        }
        try {
            const result: any = await NoderedUtil.Queue({ 
                queuename: this.WebSocketClientService.llmchat_queue, replyto: this.queuename, 
                data: payload });
        } catch (error) {
            this.loadingollama = false;
            this.errormessage = error.message ? error.message : error;
            console.error(error);            
        }
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
    lasttoolindex = 0;
    async checkForNewTools() {
        this.$timeout(()=> {
            var input = document.getElementById('chatmessage');
            if(input != null && input.focus != null) input.focus();
        }, 200)
        // if one of the last 4 messages is from role "tool" then
        // for(let y = this.messages.length - 1; y > this.lasttoolindex; y--) {
        //     console.log(y);
        //     var toolmessage = this.messages[y];
        //     if(toolmessage.role == "tool") {
        //         this.lasttoolindex = y;
        //         this.runtool(toolmessage);
        //         break;
        //     }                            
        // }
    }
    async RegisterQueue() {
        if(this.queuename != "") return;
        try {
            this.queuename = await NoderedUtil.RegisterQueue({
                callback: async (_data: QueueMessage, ack: any) => {
                    ack();
                    try {
                        if(_data == null) return;
                        var correlationId = _data.correlationId;
                        var data: any = _data;
                        if(data.data != null) data = data.data;
                        if(data.threadid != null && data.threadid != "") {
                            this.threadid = data.threadid;
                            // this.$location.path("/Chat/" + this.threadid);
                        }
                        if(data.error != null && data.error != "") {
                            console.log("ERROR")
                            console.error(data.error);
                            this.errormessage = data.error;
                            this.loadingollama = false;
                            if(data.messages != null) {
                                this.messages = data.messages;
                            }
                            this.checkForNewTools()
                            return;
                        }
                        if(data.func == "chat") {
                            console.log(data);
                            if(data.messages != null) {
                                this.messages = data.messages;
                                console.log(this.messages);
                            } else if(data.message != null) {
                                console.log(data.message);
                                // @ts-ignore
                                this.messages = this.messages.filter(x => x.temp != true);
                                this.messages.push(data.message);
                                if(data.message.role == "tool") {
                                    if(data.message.name != "RunOpenRPAWorkflow") {
                                        this.runtool(data.message);
                                    }                                    
                                }                            
                            }                        
                            this.chatmessage = "";
                            this.loadingollama = false;
                            this.errormessage = "";
                            this.checkForNewTools()
                            return;
                        } else if(data.func == "message") {
                            if(data.message != null) {
                                // @ts-ignore
                                this.messages = this.messages.filter(x => x.temp != true);
                                this.messages.push(data.message);
                                if(data.message.role == "tool") {
                                    if(data.message.name != "RunOpenRPAWorkflow") {
                                        this.runtool(data.message);
                                    }                                    
                                }                            
                                this.errormessage = "";
                            }
                        } else if(data.func == "messages") {
                            if(data.messages != null) {
                                this.messages = data.messages;
                            }
                            console.log(this.messages);
                            this.errormessage = "";
                            this.checkForNewTools()
                        } else if(data.func == "generating") {
                            // @ts-ignore
                            var temp = this.messages.find(x => x.temp == true);
                            if(temp == null) {
                                // @ts-ignore
                                temp = {"role": "assistant", "content": "", temp: true};
                                this.messages.push(temp);
                            }
                            temp.content += data.response;
                            this.$timeout(this.scrollToBottom, 100); 
                        } else {
                            if(correlationId != null && correlationId != "") {
                                var div = document.getElementById(correlationId);
                                if(div != null) {
                                    let m = "";
                                    if(data.command == "invokesuccess" || data.command == "invokecompleted" ) {
                                        try {
                                            m = JSON.stringify(data.data);
                                        } catch (error) {                                        
                                        }
                                    } else if(data.command == "timeout") {
                                        m = "TIMEOUT! is robot running ?"
                                    }
                                    div.innerText += data.command + ": " + m + "\n";
                                }
                            }
                            console.log(data);
                        }
                    } catch (error) {
                        this.errormessage = error.message ? error.message : error;
                        this.loadingollama = false;
                    } finally {
                        if (!this.$scope.$$phase) { this.$scope.$apply(); }
                    }                
                }, closedcallback: (msg) => {
                    this.queuename = "";
                    setTimeout(this.RegisterQueue.bind(this), (Math.floor(Math.random() * 6) + 1) * 500);
                }
            });
        } catch (error) {
            this.errormessage = error.message ? error.message : error;
            console.error(error);            
        }
        console.log("RegisterQueue", this.queuename);
    }
    OpenEntity(model) {
        this.$location.path("/Entity/" + this.collectionname + "/" + model._id);
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
        return;
    }

}
export class ChatThreadsCtrl extends entitiesCtrl<Provider> {
    constructor(
        public $rootScope: ng.IRootScopeService,
        public $scope: ng.IScope,
        public $location: ng.ILocationService,
        public $routeParams: ng.route.IRouteParamsService,
        public $interval: ng.IIntervalService,
        public WebSocketClientService: WebSocketClientService,
        public api,
        public userdata: userdata
    ) {
        super($rootScope, $scope, $location, $routeParams, $interval, WebSocketClientService, api, userdata);
        console.debug("ChatThreadsCtrl");
        this.basequery = { _type: "thread" };
        this.collection = "llmchat";
        this.baseprojection = { _type: 1, type: 1, name: 1, _created: 1, _createdby: 1, _modified: 1, dbusage: 1 };
        this.postloadData = this.processData;
        if (this.userdata.data.ChatThreadsCtrl) {
            this.basequery = this.userdata.data.ChatThreadsCtrl.basequery;
            this.collection = this.userdata.data.ChatThreadsCtrl.collection;
            this.baseprojection = this.userdata.data.ChatThreadsCtrl.baseprojection;
            this.orderby = this.userdata.data.ChatThreadsCtrl.orderby;
            this.searchstring = this.userdata.data.ChatThreadsCtrl.searchstring;
            this.basequeryas = this.userdata.data.ChatThreadsCtrl.basequeryas;
        }
        WebSocketClientService.onSignedin((user: TokenUser) => {
            this.loadData();
        });
    }
    async processData(): Promise<void> {
        if (!this.userdata.data.ChatThreadsCtrl) this.userdata.data.ChatThreadsCtrl = {};
        this.userdata.data.ChatThreadsCtrl.basequery = this.basequery;
        this.userdata.data.ChatThreadsCtrl.collection = this.collection;
        this.userdata.data.ChatThreadsCtrl.baseprojection = this.baseprojection;
        this.userdata.data.ChatThreadsCtrl.orderby = this.orderby;
        this.userdata.data.ChatThreadsCtrl.searchstring = this.searchstring;
        this.userdata.data.ChatThreadsCtrl.basequeryas = this.basequeryas;
        this.loading = false;
        if (!this.$scope.$$phase) { this.$scope.$apply(); }
    }
}