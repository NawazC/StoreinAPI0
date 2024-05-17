import React, { useState, useEffect } from 'react';

const url = 'https://json-storage-api.p.rapidapi.com/datalake';
const headers = {
  'Content-Type': 'application/json',
  'X-RapidAPI-Key': '1ecc2c938amsh9dc90ac3c997746p1c22f9jsn359ecba22d2c',
  'X-RapidAPI-Host': 'json-storage-api.p.rapidapi.com'
};

// Static account number
const accountId = 'USERID-4712';

function App() {
  const [amount, setAmount] = useState(0);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    loadTransactions();
  }, []);

  const storeTransaction = async (transaction) => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          '@context': [
            'http://schema4i.org/Thing.jsonld',
            'http://schema4i.org/Action.jsonld',
            'http://schema4i.org/CreateAction.jsonld'
          ],
          '@type': 'CreateAction',
          Result: {
            '@context': [
              'http://schema4i.org/DataLakeItem.jsonld',
              'http://schema4i.org/UserAccount.jsonld',
              'http://schema4i.org/OfferForPurchase.jsonld',
              'http://schema4i.org/Offer.jsonld',
              'http://schema4i.org/Organization.jsonld',
              'http://schema4i.org/PostalAddress.jsonld'
            ],
            '@type': 'DataLakeItem',
            Name: 'Transaction',
            Creator: {
              '@type': 'UserAccount',
              Identifier: accountId // Use static account number
            },
            About: {
              '@type': 'Organization'
            },
            Amount: transaction.amount,
            Balance: transaction.balance,
            Type: transaction.type,
            SerialNumber: transaction.serial // Add serial number to the transaction
          }
        })
      });

      const data = await response.json();
      console.log(data);
      // After each transaction, load the latest transactions to update the balance
      loadTransactions();
    } catch (error) {
      console.error('Error storing transaction:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          '@context': [
            'http://schema4i.org/Thing.jsonld',
            'http://schema4i.org/Action.jsonld',
            'http://schema4i.org/SearchAction.jsonld'
          ],
          '@type': 'SearchAction',
          Object: {
            '@context': [
              'http://schema4i.org/Thing.jsonld',
              'http://schema4i.org/Filter',
              'http://schema4i.org/DataLakeItem',
              'http://schema4i.org/UserAccount'
            ],
            '@type': 'Filter',
            FilterItem: {
              '@type': 'DataLakeItem',
              Creator: {
                '@type': 'UserAccount',
                Identifier: accountId // Use static account number
              }
            }
          }
        })
      });

      const data = await response.json();
      const result = data.Result.ItemListElement.map(item => item.Item);
      // Sort transactions by serial number in descending order
      result.sort((a, b) => b.SerialNumber - a.SerialNumber);
      setTransactions(result);
      if (result.length > 0) {
        // Update balance to the latest transaction's balance
        setBalance(result[result.length - 1].Balance);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const clearTransactions = async () => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          '@context': [
            'http://schema4i.org/Thing.jsonld',
            'http://schema4i.org/Action.jsonld',
            'http://schema4i.org/DeleteAction.jsonld'
          ],
          '@type': 'DeleteAction',
          Object: {
            '@context': [
              'http://schema4i.org/Thing.jsonld',
              'http://schema4i.org/Filter',
              'http://schema4i.org/DataLakeItem',
              'http://schema4i.org/UserAccount'
            ],
            '@type': 'Filter',
            FilterItem: {
              '@type': 'DataLakeItem',
              Creator: {
                '@type': 'UserAccount',
                Identifier: accountId // Use static account number
              }
            }
          }
        })
      });

      const data = await response.json();
      console.log(data);
      setTransactions([]);
      setBalance(0);
    } catch (error) {
      console.error('Error clearing transactions:', error);
    }
  };

  const handleDeposit = async () => {
    const newBalance = balance + parseFloat(amount);
    await storeTransaction({ amount: parseFloat(amount), balance: newBalance, type: 'Deposit', serial: Date.now() });
    setBalance(newBalance); // Update balance state
    setAmount(0); // Reset input field
    loadTransactions(); // Reload transactions to update balance
  };
  
  const handleWithdraw = async () => {
    const newBalance = balance - parseFloat(amount);
    await storeTransaction({ amount: parseFloat(amount), balance: newBalance, type: 'Withdraw', serial: Date.now() });
    setBalance(newBalance); // Update balance state
    setAmount(0); // Reset input field
    loadTransactions(); // Reload transactions to update balance
  };

  return (
    <div className="App">
      <h1>Transaction App</h1>
      <div>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button onClick={handleDeposit}>Deposit</button>
        <button onClick={handleWithdraw}>Withdraw</button>
      </div>
      <div>
        <h2>Current Balance: ${balance}</h2>
      </div>
      <div>
        <button onClick={loadTransactions}>Load Transactions</button>
        <button onClick={clearTransactions}>Clear Transactions</button>
        <h2>Transactions:</h2>
        <ul>
          {transactions.map((transaction, index) => (
            <li key={index}>
              Serial: {transaction.SerialNumber}, Type: {transaction.Type}, Amount: ${transaction.Amount}, Balance: ${transaction.Balance}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
