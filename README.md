# 💰 LoanManager - Customer & Loan Management System

LoanManager is a comprehensive, client-side web application designed for small-scale lenders and businesses to efficiently manage customer loans, payments, and ledgers. Built with pure HTML, CSS, and JavaScript, and powered by a Firebase backend, it offers a secure, reliable, and easy-to-use interface for tracking financial transactions.

**Live Demo:** [**https://avdeshjadon.github.io/LoanManager/**](https://avdeshjadon.github.io/LoanManager/)

## ✨ Key Features

* **🔐 Secure Authentication:** Admin login system powered by Firebase Authentication.
* **📊 Interactive Dashboard:** Get a quick overview of total customers, total loans, net balance due, and net profit from a single screen.
* **👥 Customer Management:**
    * Add, edit, and manage active customer accounts.
    * View a separate list for accounts that have been settled.
    * Quickly search through active customers.
* **💸 Transaction Tracking:**
    * Record all transactions, whether it's a new loan (payment given) or a repayment (payment received).
    * Each transaction stores its own amount, date, and interest rate.
* **📈 Dynamic Interest Calculation:**
    * Supports both **Compound** and **Simple Interest** models (for monthly payers).
    * Calculates the interest accrued on each transaction up to the current date, providing a real-time balance.
* **🧾 Professional PDF Ledgers:**
    * Generate a clean, professional PDF statement for any customer's ledger with a single click using `html2pdf.js`.
    * The generated PDF includes a detailed breakdown of all transactions, totals, and a stylish design with a company watermark.
* **📱 WhatsApp Integration:** A "Send on WhatsApp" button that downloads the PDF ledger and opens a WhatsApp chat with the customer, making it easy to share statements.
* **🔧 Advanced Tools & Settings:**
    * **Standalone Calculator:** A built-in tool to quickly calculate interest for any given principal, rate, and duration.
    * **Data Export:** Download a complete backup of all your customer data in JSON format.
    * **Theme Toggle:** Switch between a sleek Light Mode and a comfortable Dark Mode.
    * **Password Management:** Easily change your admin password.
* **📱 Fully Responsive:** The user interface is designed to work seamlessly on desktops, tablets, and mobile devices.

## 🛠️ Technology Stack

* **Frontend:** HTML5, CSS3, Vanilla JavaScript
* **Backend & Database:** Google Firebase (Firestore Database, Firebase Authentication)
* **Libraries:**
    * [Font Awesome](https://fontawesome.com/) - For icons.
    * [html2pdf.js](https://github.com/eKoopmans/html2pdf.js/) - For generating PDF statements.

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You will need a modern web browser and a code editor of your choice (like VS Code). No other installations are required to run the project.

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/avdeshjadon/LoanManager.git](https://github.com/avdeshjadon/LoanManager.git)
    ```

2.  **Navigate to the project directory:**
    ```sh
    cd LoanManager
    ```

### Firebase Setup (Required)

This project requires a Firebase project to handle the database and authentication.

1.  **Create a Firebase Project:**
    * Go to the [Firebase Console](https://console.firebase.google.com/).
    * Click on "Add project" and give it a name (e.g., `my-loan-manager`).
    * Complete the project creation steps.

2.  **Add a Web App to your Project:**
    * In your project's dashboard, click the web icon **</>** to add a new web app.
    * Give your app a nickname and click "Register app".

3.  **Get your Firebase Config:**
    * After registering, Firebase will provide a `firebaseConfig` object. **Copy this entire object.** It will look like this:
        ```javascript
        const firebaseConfig = {
          apiKey: "YOUR_API_KEY",
          authDomain: "YOUR_AUTH_DOMAIN",
          projectId: "YOUR_PROJECT_ID",
          storageBucket: "YOUR_STORAGE_BUCKET",
          messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
          appId: "YOUR_APP_ID"
        };
        ```

4.  **Add Config to `script.js`:**
    * Open the `script.js` file in your code editor.
    * Find the existing `firebaseConfig` object at the top of the file.
    * **Replace the entire existing object with the one you copied from your Firebase project.**

5.  **Enable Firestore Database:**
    * In the Firebase Console, go to the "Build" section in the left sidebar and click on **Firestore Database**.
    * Click "Create database" and start in **test mode** for easy setup. Choose a server location.

6.  **Enable Authentication:**
    * Go to the "Build" section and click on **Authentication**.
    * Go to the "Sign-in method" tab.
    * Click on **Email/Password** and enable it.
    * Go to the "Users" tab and click "Add user" to create your admin login credentials (email and password).

### Running the Application

After completing the setup, simply open the `index.html` file in your web browser. You can now log in with the admin credentials you created in Firebase.

## 📁 File Structure

```
LoanManager/
├── index.html         # The main HTML structure of the application
├── style.css          # All styles for the application and PDF template
├── script.js          # Core application logic, Firebase integration, and DOM manipulation
└── README.md          # Project documentation
```


## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📧 Contact

Avdesh Jadon - [@avdeshjadon](https://github.com/avdeshjadon)

Project Link: [https://github.com/avdeshjadon/LoanManager](https://github.com/avdeshjadon/LoanManager)
