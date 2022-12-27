import { Test } from '@nestjs/testing';
import * as path from 'path';
import { ConfigModule, ConfigService } from '../index';
import { Injectable } from '@nestjs/common';
import { ConfigParam, Configurable } from '../decorators';

describe('Config Nest Module', () => {
  it('Will boot nest-config module succesfully', async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.load(path.resolve(__dirname, '__stubs__', '**/*.ts')),
      ],
    }).compile();

    const configService = module.get<ConfigService>(ConfigService);

    expect(configService.get('config.server')).toBeTruthy();
    expect(configService.get('config.stub')).toBeTruthy();
  });

  it('Will resolve application sources path', async () => {
    const spy = jest.spyOn(ConfigService, 'resolveRootPath');

    await Test.createTestingModule({
      imports: [
        ConfigModule.resolveRootPath(__dirname).load(
          path.resolve('__stubs__', 'config.*.ts'),
        ),
      ],
    }).compile();

    const expectedAppSrcPath = path.resolve(process.cwd(), 'src');

    expect(spy).toHaveBeenCalled();
    expect(ConfigService.rootPath).toEqual(expectedAppSrcPath);
  });

  it('Will resolve application sources path with root', async () => {
    const spy = jest.spyOn(ConfigService, 'resolveRootPath');

    await Test.createTestingModule({
      imports: [
        ConfigModule.resolveRootPath(__dirname).load(
          path.resolve('__stubs__', 'config.*.ts'),
        ),
      ],
    }).compile();

    const expectedAppRootPath = path.resolve(process.cwd(), 'src');

    expect(spy).toHaveBeenCalled();
    expect(ConfigService.rootPath).toEqual(expectedAppRootPath);
  });

  it('Will Setup Modules with its Components', async () => {
    @Injectable()
    class ComponentTest {
      constructor() {}

      @Configurable()
      testConfig(@ConfigParam('config.server') configKey?: { port: number }) {
        return configKey;
      }
    }

    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.load(path.resolve(__dirname, '__stubs__', '**/*.ts')),
      ],
      providers: [ComponentTest],
    }).compile();
    const componentTest = module.get<ComponentTest>(ComponentTest);
    expect(componentTest.testConfig()).toEqual({ port: 2000 });
  });
  it('Configurable decorator should do nothing without ConfigParam decorator', async () => {
    @Injectable()
    class ComponentTest {
      constructor() {}

      @Configurable()
      testConfig(server: { port: number }) {
        return { serverPort: server.port };
      }
    }

    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.load(path.resolve(__dirname, '__stubs__', '**/*.ts')),
      ],
      providers: [ComponentTest],
    }).compile();
    const componentTest = module.get<ComponentTest>(ComponentTest);
    expect(componentTest.testConfig({ port: 42 })).toEqual({ serverPort: 42 });
  });
  it('ConfigParam decorator on null argument', async () => {
    @Injectable()
    class ComponentTest {
      constructor() {}

      @Configurable()
      testConfig(@ConfigParam('config.server') server?: { port: number }) {
        return { serverPort: server.port };
      }
    }

    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.load(path.resolve(__dirname, '__stubs__', '**/*.ts')),
      ],
      providers: [ComponentTest],
    }).compile();
    const componentTest = module.get<ComponentTest>(ComponentTest);
    expect(componentTest.testConfig()).toEqual({ serverPort: 2000 });
  });
  it('Multiple ConfigParam decorators', async () => {
    @Injectable()
    class ComponentTest {
      constructor() {}

      @Configurable()
      testConfig(
        @ConfigParam('config.server') server?: { port: number },
        @ConfigParam('config.stub') stub?: { port: number },
      ) {
        return { serverPort: server.port, stubPort: stub.port };
      }
    }

    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.load(path.resolve(__dirname, '__stubs__', '**/*.ts')),
      ],
      providers: [ComponentTest],
    }).compile();
    const componentTest = module.get<ComponentTest>(ComponentTest);
    expect(componentTest.testConfig()).toEqual({
      serverPort: 2000,
      stubPort: 2000,
    });
  });
  it('ConfigParam decorators in a static factory method with injected service', async () => {
    class ComponentTest {
      constructor(
        private readonly serverPort: number,
        private readonly stubPort: number,
      ) {}

      testConfig() {
        return { serverPort: this.serverPort, stubPort: this.stubPort };
      }
    }

    class ComponentTestFactory {
      @Configurable()
      static async get(
        @ConfigParam('config.server') server: any,
        @ConfigParam('config.stub') stub: any,
      ) {
        return new ComponentTest(server.port, stub.port);
      }
    }

    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.load(path.resolve(__dirname, '__stubs__', '**/*.ts')),
      ],
      providers: [
        {
          provide: 'ComponentTest',
          useFactory: ComponentTestFactory.get,
          inject: [ConfigService],
        },
      ],
    }).compile();

    const componentTest = module.get<ComponentTest>('ComponentTest');
    expect(componentTest.testConfig()).toEqual({
      serverPort: 2000,
      stubPort: 2000,
    });
  });

  it('ConfigParam decorators in a static factory method with injected class', async () => {
    class ComponentTest {
      constructor(
        private readonly serverPort: number,
        private readonly stubPort: number,
      ) {}

      testConfig() {
        return { serverPort: this.serverPort, stubPort: this.stubPort };
      }
    }

    class ComponentTestFactory {
      @Configurable()
      static async get(
        @ConfigParam('config.server') server: any,
        @ConfigParam('config.stub') stub: any,
      ) {
        return new ComponentTest(server.port, stub.port);
      }
    }

    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.load(path.resolve(__dirname, '__stubs__', '**/*.ts')),
      ],
      providers: [
        {
          provide: 'CONFIG_SERVICE_CLASS',
          useValue: ConfigService,
        },
        {
          provide: 'ComponentTest',
          useFactory: ComponentTestFactory.get,
          inject: ['CONFIG_SERVICE_CLASS'],
        },
      ],
    }).compile();

    const componentTest = module.get<ComponentTest>('ComponentTest');
    expect(componentTest.testConfig()).toEqual({
      serverPort: 2000,
      stubPort: 2000,
    });
  });

  it('ConfigParam decorator default value', async () => {
    @Injectable()
    class ComponentTest {
      constructor() {}

      @Configurable()
      testConfig(
        @ConfigParam('config.doesntexists', 'test123')
        configKey?: string,
      ) {
        return configKey;
      }
    }

    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.load(path.resolve(__dirname, '__stubs__', '**/*.ts')),
      ],
      providers: [ComponentTest],
    }).compile();
    const componentTest = module.get<ComponentTest>(ComponentTest);
    expect(componentTest.testConfig()).toEqual('test123');
  });
  it('Will get the right `this` from class', async () => {
    @Injectable()
    class ComponentTest {
      foo: string;
      constructor() {
        this.foo = 'bar';
      }
      @Configurable()
      testConfig(@ConfigParam('config.server') configKey?: { port: number }) {
        let result = this.testConfig2('testConfig');
        expect(result).toBeTruthy();
        expect(this.foo).toEqual('bar');
        return configKey;
      }
      testConfig2(from: string) {
        return true;
      }
    }
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.load(path.resolve(__dirname, '__stubs__', '**/*.ts')),
      ],
      providers: [ComponentTest],
    }).compile();
    const componentTest = module.get<ComponentTest>(ComponentTest);
    expect(componentTest.testConfig()).toEqual({ port: 2000 });
  });
  it('Will get the right `this` from class and its parents', async () => {
    @Injectable()
    class ComponentParentTest {
      parentFoo: string;
      constructor() {
        this.parentFoo = 'bar';
      }
      testConfig3(from: string) {
        return true;
      }
    }
    @Injectable()
    class ComponentTest extends ComponentParentTest {
      constructor() {
        super();
      }
      @Configurable()
      testConfig(@ConfigParam('config.server') configKey?: { port: number }) {
        let result = this.testConfig2('testConfig');
        let resultFromParent = this.testConfig3('testConfig');
        expect(result).toBeTruthy();
        expect(resultFromParent).toBeTruthy();
        expect(this.parentFoo).toEqual('bar');
        return configKey;
      }
      testConfig2(from: string) {
        return true;
      }
    }
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.load(path.resolve(__dirname, '__stubs__', '**/*.ts')),
      ],
      providers: [ComponentTest],
    }).compile();
    const componentTest = module.get<ComponentTest>(ComponentTest);
    expect(componentTest.testConfig()).toEqual({ port: 2000 });
  });

  it('Will allow to override config name key', async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.load(path.resolve(__dirname, '__stubs__', '**/*.ts'), {
          modifyConfigName: (name) => name.replace('config.', ''),
        }),
      ],
    }).compile();

    const configService = module.get<ConfigService>(ConfigService);

    expect(configService.get('config.server')).toBeUndefined();
    expect(configService.get('config.stub')).toBeUndefined();
    expect(configService.get('server')).toBeTruthy();
    expect(configService.get('stub')).toBeTruthy();
  });

  it('Load in production', async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.load(
          path.resolve(__dirname, '__prod_stubs__', '**/!(*.d).{ts,js}'),
        ),
      ],
    }).compile();

    const configService = module.get<ConfigService>(ConfigService);

    expect(configService.get('config.env').project).toBe('nest-config-prod');
  });
});
