# File: models.py
# Author: Kiefer Ebanks (kebanks@bu.edu), 3/20/2026
# Description: The models for the voter_analytics app

from django.db import models
from django.db.models import Count

# Create your models here.

class Voter(models.Model):
    ''' models the data attributes of an individual voter from the voter analytics dataset '''

    voter_id = models.TextField(max_length=20, unique=True)
    last_name = models.TextField(max_length=100)
    first_name = models.TextField(max_length=100)
    street_number = models.TextField(max_length=10)
    street_name = models.TextField(max_length=100)
    apartment_number = models.TextField(max_length=10, blank=True)
    zip_code = models.TextField(max_length=10)
    date_of_birth = models.DateField()
    date_of_registration = models.DateField()
    party_affiliation = models.TextField(max_length=100)
    precinct_number = models.TextField(max_length=20)
    v20state = models.BooleanField(default=False)
    v21town = models.BooleanField(default=False)
    v21primary = models.BooleanField(default=False)
    v22general = models.BooleanField(default=False)
    v23town = models.BooleanField(default=False)
    voter_score = models.IntegerField()

    def __str__(self):
        ''' returns a string representation of the Voter model so we just get their name and voter id '''
        return f'{self.first_name} {self.last_name} ({self.voter_id})'

    def get_count_by_birth_year(self, queryset=None):
        ''' list of {date_of_birth__year, count} query results for every birth year in the database '''
        qs = queryset if queryset is not None else type(self).objects.all()
        return list(
            qs.values('date_of_birth__year')
            .annotate(count=Count('pk'))
            .order_by('date_of_birth__year')
        )

    def get_count_by_party_affiliation(self, queryset=None):
        ''' list of {party_affiliation, count} query results for every party in the database '''
        qs = queryset if queryset is not None else type(self).objects.all()
        return list(
            qs.values('party_affiliation')
            .annotate(count=Count('pk'))
            .order_by('party_affiliation')
        )

    def get_count_of_voters_for_elections(self, queryset=None):
        ''' counts all voters in the DB who voted in each election '''
        qs = queryset if queryset is not None else type(self).objects.all()
        return {
            'v20state': qs.filter(v20state=True).count(),
            'v21town': qs.filter(v21town=True).count(),
            'v21primary': qs.filter(v21primary=True).count(),
            'v22general': qs.filter(v22general=True).count(),
            'v23town': qs.filter(v23town=True).count(),
        }
    

def load_data():
    ''' function to load the voter analytics dataset into the database using the Voter model '''

    filename = '/Users/kieferebanks/Documents/BU/Junior Spring/CS412/newton_voters.csv' # path to the voter analytics dataset csv file on my computer
    f = open(filename, 'r') # open the csv file for reading

    f.readline() # read the first line of the csv file to skip the header row

    for line in f: # loop through each line in the csv file

        try: #using the try except block structure as mentioned in Professor Steven's video

            #print(fields) # print the fields to check that we are parsing the csv file correctly
            
            # for j in range(len(fields)): # iterate through each field and remove any leading or trailing whitespace
                # print(f'fields[{j}] = {fields[j].strip()}')
            
            fields = line.strip().split(',') # split the line into fields using the comma as a delimiter

            # create a new Voter object using the fields from the csv file
            voter = Voter( 
                voter_id=fields[0].strip(),
                last_name=fields[1].strip(),
                first_name=fields[2].strip(),
                street_number=fields[3].strip(),
                street_name=fields[4].strip(),
                apartment_number=fields[5].strip(),
                zip_code=fields[6].strip(),
                date_of_birth=fields[7].strip(),
                date_of_registration=fields[8].strip(),
                party_affiliation=fields[9].strip(),
                precinct_number=fields[10].strip(),
                v20state=(fields[11].strip() == 'TRUE'),
                v21town=(fields[12].strip() == 'TRUE'),
                v21primary=(fields[13].strip() == 'TRUE'),
                v22general=(fields[14].strip() == 'TRUE'),
                v23town=(fields[15].strip() == 'TRUE'),
                voter_score=int(fields[16].strip())
            ) 
            
            voter.save() # save the Voter object to the database
            
            #print(f'Created voter: {voter}') # used this to print a message to confirm that the voter was created successfully when first creating voter objects

        except:
            print(f'Error processing line: {line}') # print an error message if there was an issue processing the line from the csv file