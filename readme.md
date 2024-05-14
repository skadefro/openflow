# OpenFlow
Collect, transport, store and report on events and data from humans, IT systems and the physical world

Try it online here [here](https://app.openiap.io/)

Installation guides and documentation at [docs.openiap.io](https://docs.openiap.io/docs/flow/) 

## **community help**
Join the 🤷💻🤦 [community forum](https://discourse.openiap.io/)

## **Commercial Support**
Click here for💲🤷 [Commercial Support](https://openiap.io/)

## **Build and run from source**
To use as pure api, rename public.template to public, for a basic login page.
For a full featured website build [core-web](https://github.com/openiap/core-web) and place it into the public folder.
Then run
```
npm run watch
```
to copy public to the dist folder
## using vs code
If using vs.code, create a .env file inside the config folder as explained in the [docs](https://docs.openiap.io/docs/flow/Build-from-source.html)
then simply press F5 to run using the .vscode/launch.json config.
## when not using vs code
If not, manually run 
```
npm run build
```
to compile ts files into dist, after setting the needed envoriment variables as show in the [docs](https://docs.openiap.io/docs/flow/Build-from-source.html), then run
```
node dist/index.js
```