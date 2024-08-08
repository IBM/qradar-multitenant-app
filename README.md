qradar-multitenant-app

The solution involves developing a chat assistant inside QRadar application that provides an administrative interface. This interface will allow administrators to input key elements such as tenants, associated domains, log sources, networks, security profiles, roles, and users. The goal is to streamline the creation of new tenants with a one-click process, ensuring an integrated and efficient approach.

This repo contains two main folder. 
    1. multiTenantQradarApp contains the zip file for Qradar App that we can deploy on the QRadar instance.
    2. multitenantConf-via-watsonxAssistant which has all the files that has been used in assistant for configuring the complete flow


# Importing Custom Extensions in Watsonx Assistant
    1.	Log in to your Watsonx Assistant instance.
    
    2.	Navigate to the Integration section located at the bottom left corner.
    
[img](./static/1.png)

QRadar SDK documentation https://www.ibm.com/support/pages/qradar-whats-new-app-framework-sdk-v200

how to install QRadar SDK https://www.ibm.com/support/pages/qradar-whats-new-app-framework-sdk-v200#i

# To install the app on QRadar using the SDK, follow these simple steps:

Step 1: Identify Default Server and User Values (Optional)
    qapp server -q <QRadar_server> -u <QRadar_user>

Step 2: Package the App
    qapp package -p com.mycompany.myapp.zip

Step 3: Deploy the App to QRadar
    qapp deploy -q <QRadar_server> -u <QRadar_user> -p com.mycompany.myapp.zip

Note: “Replace <QRadar_server> with the IP or hostname of your QRadar console and <QRadar_user> with the username of a user with the necessary permissions to deploy apps. The app will be uploaded to QRadar and installed for use."

