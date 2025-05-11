# BitGo Lightning Network UI Demo

A modern, user-friendly React application for interacting with the Bitcoin Lightning Network through BitGo's API. This demo showcases how to create and pay Lightning Network invoices, manage wallets, and handle transactions in a secure and efficient way.

## Features

- 🌐 Support for both Testnet (TLNBTC) and Mainnet (LNBTC) networks
- 💳 Create and manage Lightning Network wallets
- 📃 Generate Lightning Network invoices
- 💸 Pay Lightning Network invoices
- 📊 View transaction history
- 🔒 Secure wallet management
- 🎨 Modern, responsive UI
- 🌙 Dark mode interface

## Prerequisites

Before you begin, ensure you have installed:
- Node.js (v16 or higher)
- npm (v7 or higher)
- A BitGo account and API access token

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/007harshmahajan/lightning-ui-demo.git
   cd lightning-ui-demo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000`.

## Usage

1. **Network Selection**
   - Choose between Testnet (TLNBTC) and Mainnet (LNBTC)
   - Enter your BitGo API token

2. **Wallet Management**
   - Create a new wallet or connect to an existing one
   - Securely store and manage wallet credentials

3. **Creating Invoices**
   - Enter the amount in satoshis
   - Generate Lightning Network invoices
   - View invoice details and status

4. **Paying Invoices**
   - Paste Lightning Network invoice
   - Review payment details
   - Execute payment

5. **Transaction History**
   - View list of created invoices
   - Track payment history
   - Monitor transaction status

## Architecture

The application is built with:
- React 18
- TypeScript
- BitGo SDK (@bitgo/sdk-coin-lnbtc)
- Modern CSS with CSS Variables

Key components:
- `NetworkSelector`: Network selection and configuration
- `WalletCreator`: Wallet creation and management
- `InvoiceCreator`: Lightning invoice generation
- `InvoicePayment`: Payment processing
- `InvoiceList`: Transaction history display
- `PaymentList`: Payment history tracking

## Development

### Project Structure
```
lightning-ui-demo/
├── src/
│   ├── components/       # React components
│   ├── services/        # API and service integrations
│   ├── types/           # TypeScript type definitions
│   ├── contexts/        # React contexts
│   └── App.tsx          # Main application component
├── public/              # Static assets
└── package.json         # Project dependencies
```

### Available Scripts

- `npm start`: Run development server
- `npm build`: Build production version
- `npm test`: Run tests
- `npm run eject`: Eject from Create React App

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [BitGo](https://www.bitgo.com/) for their Lightning Network implementation
- [React](https://reactjs.org/) for the UI framework
- The Bitcoin Lightning Network community

## Support

For support, please:
1. Check the [Issues](https://github.com/yourusername/lightning-ui-demo/issues) page
2. Review BitGo's [Documentation](https://docs.bitgo.com/)
3. Join BitGo's developer community

## Disclaimer

This is a demo application. Use at your own risk. Always test thoroughly before using in production environments. 