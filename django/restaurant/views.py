from django import template
from django.shortcuts import render
from django.http import HttpRequest, HttpResponse

import random  # Import the random module to choose a random special
import time  # Import the time module to calculate the ready time


# Create your views here.


def main(request):
    '''
    Define a view to handle the 'main' request.
    '''

    main_image ="https://robbreport.com/wp-content/uploads/2022/03/The_Barn_Dining_Room_Photo_Credit_Alan_Shortall.jpg"
 
 
    context = {
        "image": main_image
    }
    
    template_name = "restaurant/main.html"
    return render(request, template_name, context)

def order(request):
    '''
    Define a view to handle the 'order' page request.
    '''

    template_name = "restaurant/order.html"

    #create a dictionary of daily specials and their prices
    daily_specials = {
        "16oz NY Strip": 28,
        "32oz Porterhouse": 45,
        "16oz Ribeye": 30,
        "10oz Filet Mignon": 32
    }

    # convert the daily special dictionary into a list of tuples
    # Then choose a random choice from the list of tuples to display on the order page
    today = random.choice(list(daily_specials.keys()))
    today_price = daily_specials[today]

    # creates the context dictionary for the random daily specialto pass into the order template
    context = {
        "daily_special": today,
        "daily_special_price": today_price
    }

    return render(request, template_name, context)


def confirmation(request):
    '''
    Define a view to handle the 'confirmation' page request.
    '''

    template_name = "restaurant/confirmation.html"

    print(request)

    # checking to see if there is POST data
    if request.POST:

        # extracting the data from the POST request into variables
        name = request.POST["name"]

        ordered_items = [] # list to hold ordered items
        total = 0 # variable to hold total price that gets accumulated from all items


        # check if the phone and email were provided, if not, make them an empty string
        if "phone" in request.POST and request.POST["phone"]:
            phone = request.POST["phone"]
        else:
            phone = ""

        if "email" in request.POST and request.POST["email"]:
            email = request.POST["email"]
        else:
            email = ""

        if "special_instructions" in request.POST and request.POST["special_instructions"]:
            special_instructions = request.POST["special_instructions"]
        else:
            special_instructions = ""

        # Get the selected filet sauce if one was chosen
        if "filet_sauce" in request.POST and request.POST["filet_sauce"]:
            filet_sauce = request.POST["filet_sauce"]
            # Convert to a readable format
            if filet_sauce == "peppercorn":
                filet_sauce_display = "Peppercorn Sauce"
            elif filet_sauce == "steak_sauce":
                filet_sauce_display = "Steak Sauce"
            else:
                filet_sauce_display = filet_sauce
        else:
            filet_sauce_display = ""


        for item in ["Filet Mignon", "Ribeye", "Sirloin", "T-bone", "daily_special"]:
            if item in request.POST: # check if the item was ordered, otherwise it won't be in the POST data and cause an error
                if request.POST[item]: # redundant check to ensure the value is not empty

                    if item == "daily_special": # This if is used to add the actual daily special name to the ordered items list instead of just daily_special
                        
                        # Get the actual daily special name from the hidden input field in order.html
                        daily_special_name = request.POST["daily_special_name"]
                        ordered_items.append(daily_special_name) # add the actual daily special name
                    else:
                        ordered_items.append(item) # add the item to the ordered items list

                    total += int(request.POST[item]) # add the price of the item to the total price

        
        current_time = time.time()  # Get current time     
        random_minutes = random.randint(30, 60) # Generate random minutes between 30-60
        ready_timestamp = current_time + (random_minutes * 60) # Convert random minutes to seconds then add to current time to get ready time
        ready_time_struct = time.localtime(ready_timestamp) # Convert timestamp to local struct_time
        pickup_time = time.strftime("%I:%M %p", ready_time_struct) # Format the time as a readable string

        context = {
            "name": name,
            "ordered_items": ordered_items,
            "total_price": total,
            "pickup_time": pickup_time,
            "phone": phone,
            "email": email,
            "special_instructions": special_instructions,
            "filet_sauce": filet_sauce_display,
        }

    #delegate the response to the template and pass in context variables
    return render(request, template_name, context)
