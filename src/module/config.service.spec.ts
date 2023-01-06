import * as path from 'path';
import { ConfigService } from './';

describe('Config Service', () => {
  describe('Will load configurations from given a glob', () => {
    let configService: ConfigService;
    beforeEach(async () => {
      configService = await ConfigService.load(
        path.resolve(__dirname, '..', '__tests__',  '__stubs__', '*.stub.ts'),
        false,
      );
    });
    it('Will return the value from a previously loaded config', () => {
      expect(configService.get(['config.stub', 'port'])).toEqual(2000);
    });

    it('Will return a given default value if the config path is not found', () => {
      expect(configService.get('notfound', 30000)).toEqual(30000);
    });

    it('Will set some config at runtime', () => {
      configService.set('graphql.port', 2000);
      expect(configService.get('graphql.port')).toEqual(2000);
    });

    it('Will check if the a config path exists', () => {
      expect(configService.has('notfound')).toBeFalsy();
      expect(configService.has(['config.stub', 'port'])).toBeTruthy();
    });

    it('Will merge other config from file system', async () => {
      await configService.merge(
        path.resolve(__dirname, '..', '__tests__',  '__stubs__', '*.server.ts'),
      );

      expect(configService.get(['config.server', 'port'])).toEqual(2000);
    });

    it('Will load config synchronously', () => {
      const syncConfigService = ConfigService.loadSync(
        path.resolve(__dirname, '..', '__tests__',  '__stubs__', '*.stub.ts'),
        false,
      );

      expect(syncConfigService.get(['config.stub', 'port'])).toEqual(2000);
    });

    it('Will merge other config from file system synchronously', () => {
      configService.mergeSync(
        path.resolve(__dirname, '..', '__tests__',  '__stubs__', '*.server.ts'),
      );

      expect(configService.get(['config.server', 'port'])).toEqual(2000);
    });

    it('Will invoke custom helper methods', () => {
      expect(configService._isProductionPort()).toEqual(true);
    });

    it('Will invoke custom helper methods from config', () => {
      expect(configService.get('config.stub').isProductionPort()).toEqual(true);
    });

    it('Will register custom helper', () => {
      configService.registerHelper('environment', () => {
        return 'custom';
      });
      expect(configService.environment()).toEqual('custom');
    });
  });
  
  describe('Will load configuration with a .env file', () => {
    let configService: ConfigService;
    beforeEach(async () => {
      let paths = path.resolve(__dirname, '..', '__tests__',  '__stubs__', '*.env.ts');
      configService = await ConfigService.load(paths, {
        path: path.resolve(__dirname, '..', '__tests__',  '__stubs__', '.env'),
      });
    });

    it('Will use a variable provided by the .env file', () => {
      expect(configService.get(['config.env', 'project'])).toEqual(
        'nest-config',
      );
    });
  });
  
  describe('Can resolve required paths', () => {
    let realProcessCwd;

    beforeEach(() => {
      realProcessCwd = process.cwd;
      process.cwd = () => __dirname;

      ConfigService.rootPath = undefined;
    });

    afterEach(() => {
      ConfigService.rootPath = undefined;
      process.cwd = realProcessCwd;
    });

    it('Will return a root directory', () => {
      expect(ConfigService.root()).toEqual(__dirname);
    });

    it('Will return a path relative to root directory', () => {
      const expectedPath = path.join(__dirname, 'app');
      expect(ConfigService.root('app')).toEqual(expectedPath);
    });

    it('Will resolve application src path', () => {
      const expectedAppRoot = path.join(__dirname, 'dist');
      const currentFilePath = path.join(
        __dirname,
        'dist',
        'app',
        'app.module.js',
      );

      ConfigService.resolveRootPath(currentFilePath);
      expect(ConfigService.rootPath).toEqual(expectedAppRoot);
    });

    it('Will resolve application src path only once', () => {
      const expectedAppRoot = path.join(__dirname, 'src');
      const firstStartPath = path.join(
        __dirname,
        'src',
        'app',
        'app.module.js',
      );
      const secondStartPath = path.join(
        __dirname,
        'dist',
        'app',
        'app.module.js',
      );

      ConfigService.resolveRootPath(firstStartPath);
      ConfigService.resolveRootPath(secondStartPath);
      expect(ConfigService.rootPath).toEqual(expectedAppRoot);
    });

    it('Will throw error if start path for app src resolution is not an absolute path', (done) => {
      try {
        ConfigService.resolveRootPath('some/relative/path');
      } catch (e) {
        done();
      }
    });

    it('Will return a src path equal to process root by default', () => {
      expect(ConfigService.root()).toEqual(__dirname);
    });

    it('Will return resolved app src path without passed arguments', () => {
      const appSrcRoot = path.join(__dirname, 'dist');
      const startPath = path.join(appSrcRoot, 'app', 'app.module.js');

      ConfigService.resolveRootPath(startPath);
      expect(ConfigService.root()).toEqual(appSrcRoot);
    });

    it('Will return path, relative to resolved app src path', () => {
      const appSrcRoot = path.join(__dirname, 'dist');
      const startPath = path.join(appSrcRoot, 'app', 'app.module.js');
      const expectedPath = path.join(appSrcRoot, 'config');

      ConfigService.resolveRootPath(startPath);
      expect(ConfigService.root('config')).toEqual(expectedPath);
    });

    if(process.platform !== "win32"){
      it('Will return a src directory for absolute path', () => {
        const expectedPath = '/tmp/config';
        expect(ConfigService.root('/tmp/config')).toEqual(expectedPath);
      });
    }

    it('Will resolve root with param', () => {
      expect(ConfigService.root('config')).toEqual(
        path.join(__dirname, 'config'),
      );
    });

    it('Will resolve root', () => {
      expect(ConfigService.root()).toEqual(path.join(__dirname));
    });

    it('Will return path, reolated to resolved app root path', () => {
      const root = path.join(__dirname, 'dist');
      const startPath = path.join(root, 'app', 'app.module.js');
      const expectedPath = path.join(root, 'config');

      ConfigService.resolveRootPath(startPath);
      expect(ConfigService.root('config')).toEqual(expectedPath);
    });
  });
});
