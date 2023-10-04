import { Aquarius, Config, ConfigHelper } from '@oceanprotocol/lib';

import config from './config';

export const oceanConfig: Config = new ConfigHelper().getConfig(config.network.chainId);

export const aquarius = new Aquarius(oceanConfig.metadataCacheUri!);

export const FIXED_RATE_ASSET_DID = process.env.EXPO_PUBLIC_OCEAN_FIXED_RATE_ASSET_DID || '';

export const ENTERPRISE_FIXED_RATE_ASSET_DID = process.env.EXPO_PUBLIC_OCEAN_ENTERPRISE_FIXED_RATE_ASSET_DID || '';

export const FREE_ASSET_DID = process.env.EXPO_PUBLIC_OCEAN_FREE_ASSET_DID || '';

export const ENTERPRISE_FREE_ASSET_DID = process.env.EXPO_PUBLIC_OCEAN_ENTERPRISE_FREE_ASSET_DID || '';

export const DATA_TOKEN_AMOUNT = '1';
