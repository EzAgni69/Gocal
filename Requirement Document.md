## **Requirement Gathering Document: [vanij.co](http://vanij.co) / [ezcom.co](http://ezcom.co)** 

### **1\. Core Pages & Navigation**

* **Login / Registration:** Standard user authentication.  
* **Yellow Pages Directory:** Searchable database of listings.  
* **Ads Section:** Personal Ads and system Notifications.  
* **Contact Card / Profile:** Individual identity with Image Gallery.

### **2\. Mini Website Structure (Vendor View)**

* **Home | Products | Offers | Gallery**  
* Add business days and operating hours.  
* **Contact Us:** Integration with **WhatsApp** and **Google Location**.  
* Download as PDF (Website Page)

### **3\. Customer Admin Panel (Vendor Tools)**

* **Manual Content Management:** Ability to manually add, edit, or remove images related to the **Shop** (branding) and individual **Products**.  
* **Bulk Data Management:**  
  * **CSV Import:** Capability to load product data (names, descriptions, prices) via CSV file.  
  * **Automated Image Mapping:** Vendors can upload a batch of images; the system will **automatically map** images to products based on matching the image filename to the product name or ID specified in the CSV.  
* **Lead Tracking:** View reports/analytics on "WhatsApp clicks" or "Favorite" counts.

### **4\. Interactive & Social Features**

* **Favorites & Wishlists:**  
  * Users can "**Mark Favorites**" on Post Cards.  
  * Users can build a **Wishlist** and send it to the vendor via **WhatsApp**.  
* **Quick Action Links:** Direct buttons for **Google Maps**, **WhatsApp**, and **Phone Calls**.  
* **Users** can submit reviews on both the **Post Card** and the **Mini Website.**

### **5\. Platform Features & Security**

* **Multi-Language Support:** System-wide language toggle (Hindi, English and Gujarati).  
* **Search & Discovery:** Filter and Sort functionality for Contact Card displays.  
* **Chat Bot:** Automated customer engagement.  
* **Moderation (Logged-in Users Only):** \* **Report Contact Card:** Authenticated users can flag listings for review.  
  * **Super Admin Review:** Reported cards are sent to the master dashboard for moderation.

## **Sample Pages: [vanij.co/dbhome](http://vanij.co/dbhome) & [vanij.co/mandir](http://vanij.co/mandir)** & [https://vanij.co/mandir1](https://vanij.co/mandir1)

## **User Journey**

## **1\. User Journey: Product Discovery to WhatsApp Order**

This flow covers how a regular visitor finds a product and sends a wishlist to a vendor.

1. **Search/Filter:** User enters the "Yellow Pages Directory" and uses **Sort/Filter** to find a relevant Contact Card.  
2. **View Mini Website:** User clicks the card to open the vendor’s **Mini Website**.  
3. **Browse Products:** User navigates to the **Products** tab.  
4. **Add to Wishlist:** User clicks the "Add to Wishlist" icon on various items.  
5. **Review Wishlist:** User opens their Wishlist tray/page.  
6. **Send to Vendor:** User clicks **"Send via WhatsApp"**.  
   * *System Action:* The app generates a pre-filled WhatsApp message listing the product names and links, then opens the vendor’s WhatsApp chat.  
7. **Quick Actions:** User can also click the **Google Map** link on the contact card to get directions to the physical shop.

---

## **2\. Customer Admin Journey: Bulk Product Upload (CSV)**

This flow covers how a vendor manages large amounts of data efficiently.

1. **Login:** Vendor logs into the **Customer Admin Panel**.  
2. **Upload CSV:** Vendor selects "Bulk Upload" and attaches their product data sheet (CSV).  
   * *System Action:* System validates columns (Product Name, Price, Description).  
3. **Upload Images:** Vendor selects a batch of images from their device.  
4. **Auto-Mapping:** \* *System Action:* The system runs a matching script. If the CSV has a product named "Blue Widget" and an image is titled `blue-widget.jpg`, the system links them automatically.  
5. **Review & Confirm:** System shows a preview of products with their mapped images. Vendor clicks "Publish."  
6. **Live Update:** The vendor’s **Mini Website** is updated instantly with new stock.

---

## **3\. Logged-in User Journey: Security & Reporting**

This flow covers the moderation aspect you requested.

1. **Authentication:** User logs into their account.  
2. **Identification:** User notices a Contact Card with fraudulent or inappropriate information.  
3. **Initiate Report:** User clicks the **"Report"** button (visible only to logged-in users).  
4. **Submit Details:** A pop-up appears; the user selects a reason (e.g., "Spam," "Wrong Location," "Offensive Content") and adds an optional comment.  
5. **Admin Queue:** \* *System Action:* The report is sent to the **Super Admin Panel**.  
   * *System Action:* The "Reported" status is logged against that specific Contact Card ID.  
6. **Resolution:** Super Admin reviews the report and chooses to *Dismiss*, *Warning*, or *Delete* the card.

---

## **4\. User Journey: Managing Favorites**

1. **Browse:** User explores the Directory.  
2. **Mark Favorite:** User clicks the "Heart" icon on a Post Card.  
   * *System Action:* Card ID is saved to the user's "Favorites" database.  
3. **Access Favorites:** User goes to their profile dashboard and selects **"My Favorites"**.  
4. **Filtered View:** The user sees a curated list of only their saved vendors for quick contact.

