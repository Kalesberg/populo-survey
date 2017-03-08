import json
from pymongo import MongoClient
import urllib2
import urllib

tagInput = 'Skills'
db_host = '52.48.79.171'
db_port = '27017'
db_user = 'populo_assessment'
db_pass = urllib.quote_plus('Populo_Assessment')
db_schema = 'assessment_populo_prod'
reformedJSON_domain = 'dev.populo.co'

rules = {
	'>= 2 and %s < 4': '%s have good expertise in %s than others',
	'< 2 and %s > 0': '%s have less expertise in %s than others',
	'== 4 and %s == 4': '%s have great expertise in %s than others',
	'== 0 and %s == 0': '%s have no expertise in %s than others'
}
db_user_pass = "" if db_user == "" else db_user + ":" + db_pass + "@"
mongo_uri = "mongodb://" + db_user_pass + db_host + ":" + db_port + "/" + db_schema

try: 
	mongo_con = MongoClient(mongo_uri)
except pymongo.errors.ConnectionFailure, e:
   print "Could not connect to MongoDB: %s" % e

db = mongo_con[db_schema]
db.insights.delete_many({})

# load json file
url = 'http://' + reformedJSON_domain + '/getReformedJSON'
reformedJSONData = urllib2.urlopen(url).read()
loadedJsnFileData = json.loads(reformedJSONData)	

# >> Survey
getSurveyAssessments = []
for index in range(len(loadedJsnFileData['reformedJSON']['surveys'])):
	getSurveyAssessments.append(loadedJsnFileData['reformedJSON']['surveys'][index]['assessments'])	

# >> Assessments	
inputTagAssessmentId = []
for i1 in range(len(getSurveyAssessments)):
	for i2 in range(len(getSurveyAssessments[i1])):
		for i3 in range(len(loadedJsnFileData['reformedJSON']['assessments'])):
			if (loadedJsnFileData['reformedJSON']['assessments'][i3]['_id']==getSurveyAssessments[i1][i2]['_id']) and (loadedJsnFileData['reformedJSON']['assessments'][i3]['tag']==tagInput):
				inputTagAssessmentId.append(loadedJsnFileData['reformedJSON']['assessments'][i3]['_id'])

# >> Submission	
answerIdNuserId = {}
for i4 in range(len(inputTagAssessmentId)):
	counter1 = 0		
	for i5 in range(len(loadedJsnFileData['reformedJSON']['submissions'])):
		if loadedJsnFileData['reformedJSON']['submissions'][i5]['assessment']==inputTagAssessmentId[i4]:				
			answerIdNuserId[counter1] = []
			answerIdNuserId[counter1] = {'answers':loadedJsnFileData['reformedJSON']['submissions'][i5]['answers'],'userId':loadedJsnFileData['reformedJSON']['submissions'][i5]['user']}
			counter1 = counter1+1

output = {}
for i6 in range(len(answerIdNuserId)):
	for i7 in range(len(answerIdNuserId[i6]['answers'])):					
		for i8 in range(len(loadedJsnFileData['reformedJSON']['answers'])):					
			if loadedJsnFileData['reformedJSON']['answers'][i8]['_id']==answerIdNuserId[i6]['answers'][i7]['_id']:
				if loadedJsnFileData['reformedJSON']['answers'][i8]['question'] not in output:
					output[loadedJsnFileData['reformedJSON']['answers'][i8]['question']] = []

				output[loadedJsnFileData['reformedJSON']['answers'][i8]['question']].append({'userId':answerIdNuserId[i6]['userId'],'selectedOption':loadedJsnFileData['reformedJSON']['answers'][i8]['selectedOption']})

# get Question Title with Highest Selected User Name and Lowest Selected User Name
# usersHighestLowestQuestion = {}	
for i9 in range(len(output)):		
	# access str index
	q = output.keys()[i9]
	
	for rule in rules:
		listFilteredUsers = []
		listOtherUsers = []
		selectedUserName = ''
		questionName = ''

		# get Question Title
		for iQuestion in range(len(loadedJsnFileData['reformedJSON']['questions'])):
			if loadedJsnFileData['reformedJSON']['questions'][iQuestion]['_id']==q:
				questionName=loadedJsnFileData['reformedJSON']['questions'][iQuestion]['title']

		listFilteredUsers = [studRes for studRes in output[q] if eval('studRes["selectedOption"]' + (rule % studRes["selectedOption"]))]
		
		for iFilteredUser in range(len(listFilteredUsers)):
			for iUser in range(len(loadedJsnFileData['reformedJSON']['users'])):
				if loadedJsnFileData['reformedJSON']['users'][iUser]['_id'] == listFilteredUsers[iFilteredUser]['userId']:
					selectedUserName = loadedJsnFileData['reformedJSON']['users'][iUser]['full_legal_name']
					# RESULT
					insights_txt = rules[rule] % (selectedUserName, questionName)
					print insights_txt
					db.insights.insert({"userId": loadedJsnFileData['reformedJSON']['users'][iUser]['_id'], "text": insights_txt})
	
		# if rule == 'max':
		# 	seleclistFilteredUserstedOptionIndexIs = max(xrange(len(output[q])), key=lambda index: output[q][index]['selectedOption'])
		# elif rule == 'min':
		# 	listFilteredUsers = min(xrange(len(output[q])), key=lambda index: output[q][index]['selectedOption'])

		# get Highest Selected User Name and Lowest Selected User Name
			#
			#if output[q][maxSelectedOptionIndexIs]['userId'] not in usersHighestLowestQuestion:
			#	usersHighestLowestQuestion[output[q][maxSelectedOptionIndexIs]['userId']] = []				
			#usersHighestLowestQuestion[output[q][maxSelectedOptionIndexIs]['userId']].append({'highestQuestionId':q,'lowestQuestionId':''})
				

			# if loadedJsnFileData['reformedJSON']['users'][iUser]['_id']==output[q][selectedOptionIndexIs]['userId']:
			# 	lowestUserName=loadedJsnFileData['reformedJSON']['users'][iUser]['full_legal_name']
			# 	# 
			# 	if output[q][minSelectedOptionIndexIs]['userId'] not in usersHighestLowestQuestion:
			# 		usersHighestLowestQuestion[output[q][minSelectedOptionIndexIs]['userId']] = []				
			# 	usersHighestLowestQuestion[output[q][minSelectedOptionIndexIs]['userId']].append({'highestQuestionId':'','lowestQuestionId':q})

# print "--------------------------------"
# # print usersHighestLowestQuestion
# print "--------------------------------"

# get manager ids
# managersId = []
# for iUser1 in range(len(loadedJsnFileData['reformedJSON']['users'])):
# 	if loadedJsnFileData['reformedJSON']['users'][iUser1]['role']=='Manager':			
# 		managersId.append(loadedJsnFileData['reformedJSON']['users'][iUser1]['employee_id'])


# for iManagerId in managersId:		

# 	managerName=''
# 	for iForManagerName in range(len(loadedJsnFileData['reformedJSON']['users'])):
# 		if loadedJsnFileData['reformedJSON']['users'][iForManagerName]['manager_id']==iManagerId:
# 			managerName=loadedJsnFileData['reformedJSON']['users'][iForManagerName]['full_legal_name']

# 	print " >> Manager Name (Id) is : "+ managerName + " (" + iManagerId + ")"

# 	for iUser2 in range(len(loadedJsnFileData['reformedJSON']['users'])):
# 		if loadedJsnFileData['reformedJSON']['users'][iUser2]['manager_id']==iManagerId:
# 			for i14 in range(len(usersHighestLowestQuestion)):							
# 				if usersHighestLowestQuestion.keys()[i14]==loadedJsnFileData['reformedJSON']['users'][iUser2]['_id']:

# 					qNameForHighest=''
# 					for i15 in usersHighestLowestQuestion[usersHighestLowestQuestion.keys()[i14]]:
# 						if i15['highestQuestionId']:								
# 							for iQ16 in loadedJsnFileData['reformedJSON']['questions']:
# 								if iQ16['_id']==i15['highestQuestionId']:
# 									qNameForHighest = qNameForHighest + " - " + iQ16['title']

# 					qNameForLowest=''
# 					for i15 in usersHighestLowestQuestion[usersHighestLowestQuestion.keys()[i14]]:
# 						if i15['lowestQuestionId']:								
# 							for iQ16 in loadedJsnFileData['reformedJSON']['questions']:
# 								if iQ16['_id']==i15['lowestQuestionId']:
# 									qNameForLowest = qNameForLowest + " - " + iQ16['title']

# 					print " >> "+loadedJsnFileData['reformedJSON']['users'][iUser2]['full_legal_name']+" have "+qNameForHighest+" : with STRONG AREA | & | "+qNameForLowest+" : with WEAK AREA"

