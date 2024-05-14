import { suite, test, timeout } from '@testdeck/mocha';
import { Config } from "../Config.js";
import { Logger } from '../Logger.js';
import { User } from '@openiap/openflow-api';

@suite class run_cli_test {
    private rootToken: string;
    private testUser: User;
    private userToken: string;
    @timeout(10000)
    async before() {
        Config.disablelogging();
        await Logger.configure(true, true);
    }
    @timeout(10000)
    async after() {
        Config.workitem_queue_monitoring_enabled = false;
        await Logger.shutdown();
        // wtf.dump();
    }
    // @timeout(5000)
    // @test 'Include cli'() {
    //     require('../cli');
    // }

}
// clear && ./node_modules/.bin/_mocha 'test/**/run-cli.test.ts'