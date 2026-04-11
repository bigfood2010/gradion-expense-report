import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PERSISTENCE_ENTITIES } from './typeorm/persistence-entities';
import { buildPersistenceDataSourceOptionsFromConfig } from './typeorm/persistence-typeorm-options';

@Global()
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        buildPersistenceDataSourceOptionsFromConfig(configService),
    }),
    TypeOrmModule.forFeature([...PERSISTENCE_ENTITIES]),
  ],
  exports: [TypeOrmModule],
})
export class PersistenceModule {}
