import { useEffect, useState } from 'react';
import { Box, Select, MenuItem, Typography } from '@mui/material';
import type { AnyJson } from '@polkadot/types/types';
import { web3FromSource } from '@polkadot/extension-dapp';
import { useApi } from './apiContext';
import { useAccount } from './accountContext';
import { sendAndFinalize, normalizeClass, normalizeAsset } from './utils';
import BurnAssetForm from './components/BurnAssetForm';
import TransferAssetForm from './components/TransferAssetForm';
import SetMetadataForm from './components/SetMetadataForm';
import MintAssetForm from './components/MintAssetForm';
import CreateClassForm from './components/CreateClassForm';
import MintAssetWithMetadataForm from './components/MintAssetWithMetadataForm';
import PalletInfo from './components/PalletInfo';
import StoreAsset from './components/StoreAsset';

function App() {
  const [classes, setClasses] = useState<{ id: number, value: AnyJson }[]>([]);
  const [assets, setAssets] = useState<{ id: number, value: AnyJson }[]>([]);
  const [metadata, setMetadata] = useState<AnyJson | void>();
  const [selectedClass, selectClass] = useState<number | void>();
  const [selectedAsset, selectAsset] = useState<number | void>();

  const { api, chainName } = useApi();
  const { accounts, selectedAccount, selectAccount } = useAccount();

  useEffect(() => {
    if (api) {
      api.query.uniques.class.entries().then(data => {
        const classes = data.map(normalizeClass)
        setClasses(classes);
      })
    }
  }, [api]);

  useEffect(() => {
    if (selectedClass !== undefined && api) {
      api.query.uniques.asset.entries(selectedClass).then(data => {
        const assets = data.map(normalizeAsset);
        setAssets(assets);
      })
    }
  }, [api, selectedClass]);

  useEffect(() => {
    if (selectedAsset && api) {
      api.query.uniques.instanceMetadataOf(selectedClass, selectedAsset).then(metadata => {
        setMetadata(metadata.toHuman());
      })
    }
  }, [api, selectedAsset]);

  const handleClassClick = (id: number) => {
    selectAsset();
    setMetadata();
    selectClass(id)
  }

  const mint = async ({ classId, assetId }: Record<string, string>) => {
    const account = accounts.find(({ meta }) => meta.name === selectedAccount);

    if (account && api) {
      const extrinsic = api.tx.uniques.mint(parseInt(classId, 10), parseInt(assetId, 10), account.address);
      const injector = await web3FromSource(account.meta.source);
      const { block } = await sendAndFinalize(extrinsic, account.address, api, injector.signer);
      console.log("Block: ", block);
    }
  }

  const mintWithMetadata = async ({ classId, assetId, metadata, isFrozen }: Record<string, string | boolean>) => {
    const account = accounts.find(({ meta }) => meta.name === selectedAccount);

    if (account && api) {
      const mint = api.tx.uniques.mint(parseInt(classId as string, 10), parseInt(assetId as string, 10), account.address);
      const setMetadata = api.tx.uniques.setMetadata(parseInt(classId as string, 10), parseInt(assetId as string, 10), metadata, isFrozen);
      const batch = api.tx.utility.batch([mint, setMetadata]);
      const injector = await web3FromSource(account.meta.source);
      const { block } = await sendAndFinalize(batch, account.address, api, injector.signer);
      console.log("Block: ", block);
    }
  }

  const createClass = async ({ classId }: Record<string, string>) => {
    const account = accounts.find(({ meta }) => meta.name === selectedAccount);

    if (account && api) {
      const extrinsic = api.tx.uniques.create(parseInt(classId, 10), account.address);
      const injector = await web3FromSource(account.meta.source);
      const { block } = await sendAndFinalize(extrinsic, account.address, api, injector.signer);
      console.log("Block: ", block);
    }
  }

  const setAssetMetadata = async ({ classId, assetId, metadata, isFrozen }: Record<string, string | boolean>) => {
    const account = accounts.find(({ meta }) => meta.name === selectedAccount);

    if (account && api) {
      const extrinsic = api.tx.uniques.setMetadata(parseInt(classId as string, 10), parseInt(assetId as string, 10), metadata, isFrozen);
      const injector = await web3FromSource(account.meta.source);
      const { block } = await sendAndFinalize(extrinsic, account.address, api, injector.signer);
      console.log("Block: ", block);
    }
  }

  const transfer = async ({ classId, assetId, destination }: Record<string, string>) => {
    const account = accounts.find(({ meta }) => meta.name === selectedAccount);

    if (account && api) {
      const extrinsic = api.tx.uniques.transfer(parseInt(classId, 10), parseInt(assetId, 10), destination);
      const injector = await web3FromSource(account.meta.source);
      const { block } = await sendAndFinalize(extrinsic, account.address, api, injector.signer);
      console.log("Block: ", block);
    }
  }

  const burn = async ({ classId, assetId }: Record<string, string>) => {
    const account = accounts.find(({ meta }) => meta.name === selectedAccount);

    if (account && api) {
      const extrinsic = api.tx.uniques.burn(parseInt(classId, 10), parseInt(assetId, 10), null);
      const injector = await web3FromSource(account.meta.source);
      const { block } = await sendAndFinalize(extrinsic, account.address, api, injector.signer);
      console.log("Block: ", block);
    }
  }

  return (
    <Box sx={{ padding: '20px' }}>
      <Box mb={3}>
        <Typography variant="h5">Chain: {chainName}</Typography>
      </Box>
      <Box mb={3}>
        <Typography variant="h5">Account</Typography>
        <Select
          value={selectedAccount}
          onChange={(event) => selectAccount(event.target.value)}
        >
          {accounts.map(({ meta }) => (
            <MenuItem key={meta.name as string} value={meta.name as string}>{meta.name as string}</MenuItem>
          ))}
        </Select>
      </Box>
      <PalletInfo
        classes={classes}
        assets={assets}
        metadata={metadata}
        handleClassClick={handleClassClick}
        handleAssetClick={selectAsset}
        selectedClass={selectedClass}
        selectedAsset={selectedAsset}
      />
      <StoreAsset />
      <CreateClassForm handleSubmit={createClass} />
      <MintAssetForm handleSubmit={mint} />
      <SetMetadataForm handleSubmit={setAssetMetadata} />
      <MintAssetWithMetadataForm handleSubmit={mintWithMetadata} />
      <TransferAssetForm handleSubmit={transfer} />
      <BurnAssetForm handleSubmit={burn} />
    </Box >
  );
}

export default App;
