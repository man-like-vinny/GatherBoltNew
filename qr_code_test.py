import requests
import json
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPDF, renderPM

url = "https://api.qr-code-generator.com/v1/create?access-token=ln8vLYvUZrJR97khtmrQ4drdahi3CEhYYufT0Kzh1zWrU1REj2MniG69-xLonkLU"

customer_dict = {
    'eventName': 'MU Bollywood Night',
    'customerName': 'Wafiyah',
    'customerEmail': 'wafiyahzaidi@hotmail.com',
    'customerID': 'cus_PvI9kw0DsYCQxd',
    'ticketDescription': 'Standard x 1',
    'totalPaid': 10.49,
    'feePaid': 0.49200000000000005,
    'bookingFeeRequired': 'True',
    }

qr_code_text = json.dumps(customer_dict)

payload = json.dumps({
  "frame_name": "bottom-frame",
  "qr_code_text": qr_code_text,
  "image_format": "PNG",
  "frame_color": "#131313",
  "frame_icon_name": "mobile",
  "image_width": 400,
  "frame_text": "Eventifyed",
  "marker_left_template": "version13",
  "marker_right_template": "version13",
  "marker_bottom_template": "version13",
})
headers = {
  'Content-Type': 'application/json',
  'Cookie': 'AWSALB=mjK0XwMtS9Sta9QVo0hZaph6Nyqb9tqVQfZvFDr93eL/Zx9zqUnssj56QNCB1v6cCSzB9vfsQ3lb+LSmaTICrBh5ugDeeTj9yctmifsNWfEFtphXyg5LE4Tc8sE6; AWSALBCORS=mjK0XwMtS9Sta9QVo0hZaph6Nyqb9tqVQfZvFDr93eL/Zx9zqUnssj56QNCB1v6cCSzB9vfsQ3lb+LSmaTICrBh5ugDeeTj9yctmifsNWfEFtphXyg5LE4Tc8sE6'
}

response = requests.post(url, headers=headers, data=payload)

if response.status_code == 200:
    # Save the SVG content to a file
    with open(f"CustomerQRCodes/{customer_dict['customerID']}_{customer_dict['eventName']}_Eventifyed_Pass.png", 'wb') as file:
        file.write(response.content)

    # Convert SVG to PNG (optional, for visualization purposes)
    # drawing = svg2rlg("output.svg")
    # renderPM.drawToFile(drawing, "output.png", fmt="PNG")

    print("QR code saved as output.svg and output.png")
else:
    print(f"Error: {response.status_code} - {response.text}")


import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage

def send_email(email_address, first_name, customer_id, event_name, ticket_description_with_line_breaks):
    try:
        # Read PNG content synchronously
        with open(f'CustomerQRCodes/{customer_id}_{event_name}_Eventifyed_Pass.png', 'rb') as png_file:
            png_content = png_file.read()

        # Create SMTP transporter
        smtp = smtplib.SMTP(host='smtp.mailersend.net', port=587)
        smtp.starttls()

        # Authenticate with SMTP server
        smtp.login('MS_pvACRO@eventifyed.com', 'hdeiLtXLQaARPgrf')

        # Construct email
        msg = MIMEMultipart()
        msg['From'] = 'Eventifyed <team@eventifyed.com>'
        msg['To'] = email_address
        msg['Bcc'] = 'Eventifyed <team@eventifyed.com>'
        msg['Reply-To'] = 'team@eventifyed.com'
        msg['Subject'] = "You've got tickets from Eventifyed"

        # Email content
        html_content = f"""<p>Hi {first_name},</p>
                        <p>We are pleased to inform you that you have successfully received the following tickets for {event_name}:</p>
                        <p><strong>{ticket_description_with_line_breaks}</strong></p>
                        <p>Enclosed within this email, you will find your personalized QR code, which will serve as your entry pass. Please ensure to present this QR code to the designated ticket organizer upon arrival at the event venue.</p>
                        <p>Should you encounter any challenges in accessing or retrieving your QR code, please do not hesitate to contact us by simply replying to this email. Our team is readily available to assist you in resolving any queries or concerns you may have.</p>
                        <p>We look forward to your attendance and wish you an enjoyable experience at {event_name}.</p>
                        <p>Warm regards,</p>
                        <p>Vinayak<br>Founder @ Eventifyed</p>"""
        msg.attach(MIMEText(html_content, 'html'))

        # Attach QR code image
        image_attachment = MIMEImage(png_content)
        image_attachment.add_header('Content-Disposition', f'attachment; filename="{customer_id}_{event_name}_Eventifyed_Pass.png"')
        msg.attach(image_attachment)

        # Send email
        smtp.send_message(msg)

        print("Email sent successfully")

    except Exception as e:
        print("Error sending email:", e)
        raise e

    finally:
        smtp.quit()  # Close SMTP connection

# Usage example
send_email(
    f"{customer_dict['customerEmail']}",
    f"{customer_dict['customerName']}",
    f"{customer_dict['customerID']}",
    f"{customer_dict['eventName']}",
    f"{customer_dict['ticketDescription']}"
)

