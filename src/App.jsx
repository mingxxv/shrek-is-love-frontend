import React, { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import { Connection, PublicKey, clusterApiUrl} from '@solana/web3.js';
import {
  Program, Provider, web3
} from '@project-serum/anchor';

import idl from './idl.json';
import { Buffer } from 'buffer';
window.Buffer = Buffer;
import kp from './keypair.json'

// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, Keypair } = web3;

// Create a keypair for the account that will hold the GIF data.
const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)

// Get our program's id from the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devnet.
const network = clusterApiUrl('devnet');

// Controls how we want to acknowledge when a transaction is "done".
const opts = {
  preflightCommitment: "processed"
}

// Cool GIF Array of stuff I guess
const TEST_GIFS = [
  'https://media1.giphy.com/media/pyQV6sy5qOALu/200w.webp?cid=ecf05e47vf12m1a59yk6r44smm9swt9vaovpqoj81d2nxuvh&rid=200w.webp&ct=g',
  'https://media1.giphy.com/media/toYIS95xETUPLmU9WP/giphy.webp?cid=ecf05e47vf12m1a59yk6r44smm9swt9vaovpqoj81d2nxuvh&rid=giphy.webp&ct=g',
  'https://media0.giphy.com/media/3o72F8VCXCSusbmbwk/200.webp?cid=ecf05e47vf12m1a59yk6r44smm9swt9vaovpqoj81d2nxuvh&rid=200.webp&ct=g',
  'https://media3.giphy.com/media/AMIzXteYxiNWM/200w.webp?cid=ecf05e47vf12m1a59yk6r44smm9swt9vaovpqoj81d2nxuvh&rid=200w.webp&ct=g'
]

// Constants
const TWITTER_HANDLE = 'ming_xxv';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const SHREK_GIF = "https://media4.giphy.com/media/PgJwMLahrGc3IcteOt/giphy.gif?cid=ecf05e474k5g8io4qhvl6qnwuxiv78d992ro1vqn4dky1z0v&rid=giphy.gif&ct=g"

const App = () => {

  // Oh no, React states again?!
  const [walletAddress, setWalletAddress] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const [gifList, setGifList] = useState([])

  //check for Phantom wallet
  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom wallet found!');
          const response = await solana.connect({ onlyIfTrusted: true });
        console.log(
          'Connected with Public Key:',
          response.publicKey.toString()
          )
          setWalletAddress(response.publicKey.toString())
        }
      } else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;

  if (solana) {
    const response = await solana.connect();
    console.log('Connected with Public Key:', response.publicKey.toString());
    setWalletAddress(response.publicKey.toString());
  }
  };

  // adds user gif input into react state when user starts typing
  const onInputChange = (event) => {
    const {value} = event.target;
    setInputValue(value)
  }

  const getProvider = () => {
  const connection = new Connection(network, opts.preflightCommitment);
  const provider = new Provider(
    connection, window.solana, opts.preflightCommitment,
  );
	return provider;
}

  const createGifAccount = async () => {
  try {
    const provider = getProvider();
    const program = new Program(idl, programID, provider);
    console.log("ping")
    await program.rpc.startStuffOff({
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [baseAccount]
    });
    console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
    await getGifList();

  } catch(error) {
    console.log("Error creating BaseAccount account:", error)
  }
}

  // sendGif goodness mmmmyeah
  const sendGif = async () => {
  if (inputValue.length === 0) {
    console.log("No gif link given!")
    return
  }
  setInputValue('');
  console.log('Gif link:', inputValue);
  try {
    const provider = getProvider();
    const program = new Program(idl, programID, provider);

    await program.rpc.addGif(inputValue, {
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
      },
    });
    console.log("GIF successfully sent to program", inputValue)

    await getGifList();
  } catch (error) {
    console.log("Error sending GIF:", error)
  }
};

  //When user has not connected wallet yet
  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
      >
      Connect to Wallet
      </button>
  )

  // aw yeahh lets have a connected wallet nowwww LFG WOOHOO
  const renderConnectedContainer = () => {
// If we hit this, it means the program account hasn't been initialized.
  if (gifList === null) {
    return (
      <div className="connected-container">
        <button className="cta-button submit-gif-button" onClick={createGifAccount}>
          Do One-Time Initialization For GIF Program Account
        </button>
      </div>
    )
  } 
	// Otherwise, we're good! Account exists. User can submit GIFs.
	else {
    return(
      <div className="connected-container">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendGif();
          }}
        >
          <input
            type="text"
            placeholder="Enter gif link!"
            value={inputValue}
            onChange={onInputChange}
          />
          <button type="submit" className="cta-button submit-gif-button">
            Submit
          </button>
        </form>
        <div className="gif-grid">
					{/* We use index as the key instead, also, the src is now item.gifLink */}
          {gifList.map((item, index) => (
            <div className="gif-item" key={index}>
              <img src={item.gifLink} />
            </div>
          ))}
        </div>
      </div>
    )
  }
}
  

  // add event listener to listen for Phantom wallet
  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  const getGifList = async() => {
  try {
    const provider = getProvider();
    const program = new Program(idl, programID, provider);
    const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    
    console.log("Got the account", account)
    setGifList(account.gifList)

  } catch (error) {
    console.log("Error in getGifList: ", error)
    setGifList(null);
  }
}

useEffect(() => {
  if (walletAddress) {
    console.log('Fetching GIF list...');
    getGifList()
  }
}, [walletAddress]);

  
  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header">铭's Shrek Portal</p>
          <img className="shrekMyMan" src={SHREK_GIF}/>
          <p className="sub-text">
            Somebody once told me the world is gonna roll me ✨
          </p>
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`@${TWITTER_HANDLE} is the sharpest tool in the shed`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
