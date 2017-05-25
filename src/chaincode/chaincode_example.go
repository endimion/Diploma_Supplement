/*
Copyright IBM Corp. 2016 All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package main

import (
	"errors"
	"fmt"
	"strconv"
	"encoding/json"
	"github.com/hyperledger/fabric/core/chaincode/shim"

)

// SimpleChaincode example simple Chaincode implementation
type SimpleChaincode struct {
}
//Diploma Suplement Structure
type DiplomaSupplement struct {
	Owner string
	University string
	Authorized []string
	Id string
}

// Structure that holds all the assets of the app
type Assets struct{
	Supplements []DiplomaSupplement
	Employers []string
	Universities []string
}

type SupplementsAsset struct{
	Supplements []DiplomaSupplement
}

type EmployersAsset struct{
	Employers []string
}

type UniversitiesAsset struct{
	Universities []string
}


var EVENT_COUNTER = "event_counter"


func (t *SimpleChaincode) Init(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	// var A, B string    // Entities
	// var Aval, Bval int // Asset holdings
	// var err error
	var testSupplement  DiplomaSupplement // Fake  Diploma supplement

	// "list", slice in golang, that will hold the DiplomaSupplements as strings
	var supplements = make([]DiplomaSupplement,0)
	// slice, that will hold the eIDs of the employers as strings
	var employers = make([]string,0)
	// slice, that will hold the eIDs of the universities as strings
	var universities = make([]string,0)



	// if len(args) != 4 {
	// 	return nil, errors.New("Incorrect number of arguments. Expecting 4")
	// }

	// Initialize the chaincode
	// A = args[0]
	// Aval, err = strconv.Atoi(args[1])
	// if err != nil {
	// 	return nil, errors.New("Expecting integer value for asset holding")
	// }
	// B = args[2]
	// Bval, err = strconv.Atoi(args[3])
	// if err != nil {
	// 	return nil, errors.New("Expecting integer value for asset holding")
	// }
	// fmt.Printf("Aval = %d, Bval = %d\n", Aval, Bval)

	// Write the state to the ledger
	// err = stub.PutState(A, []byte(strconv.Itoa(Aval)))
	// if err != nil {
	// 	return nil, err
	// }
	//
	// err = stub.PutState(B, []byte(strconv.Itoa(Bval)))
	// if err != nil {
	// 	return nil, err
	// }
	//
	// err = stub.PutState(EVENT_COUNTER, []byte("1"))
	// if err != nil {
	// 	return nil, err
	// }
	//add the diploma supplement to the state of the blockchain
	authorizedUsers := make([]string,0)
	testSupplement = DiplomaSupplement{Owner: "me", University:"ntua", Authorized:authorizedUsers}

	supplements = append(supplements,testSupplement)

	jsonDip, err := json.Marshal(testSupplement)
	if err != nil {
		fmt.Println("error:", err)
	}

	err = stub.PutState("Test", []byte(jsonDip))
	if err != nil {
		return nil, err
	}

	assets := Assets{Universities: universities, Employers:employers, Supplements:supplements}
	encodedAssets,err  := json.Marshal(assets)
	err = stub.PutState("assets", []byte(encodedAssets))
	if err != nil {
		return nil, err
	}

	return nil, nil
}

// Transaction makes payment of X units from A to B
func (t *SimpleChaincode) Invoke(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	// if function == "delete" {
	// 	// Deletes an entity from its state
	// 	return t.delete(stub, args)
	// }

	if function == "publish"{
		return t.publish(stub, args)
	}

	if function == "addAuthorizedUser"{
		return t.addAuthorizedUser(stub, args)
	}


	var A, B string    // Entities
	var Aval, Bval int // Asset holdings
	var X int          // Transaction value
	var err error

	if len(args) != 3 {
		return nil, errors.New("Incorrect number of arguments. Expecting 3")
	}

	A = args[0]
	B = args[1]

	// Get the state from the ledger
	Avalbytes, err := stub.GetState(A)
	if err != nil {
		return nil, errors.New("Failed to get state")
	}
	if Avalbytes == nil {
		return nil, errors.New("Entity not found")
	}
	Aval, _ = strconv.Atoi(string(Avalbytes))

	Bvalbytes, err := stub.GetState(B)
	if err != nil {
		return nil, errors.New("Failed to get state")
	}
	if Bvalbytes == nil {
		return nil, errors.New("Entity not found")
	}
	Bval, _ = strconv.Atoi(string(Bvalbytes))

	// Perform the execution
	X, err = strconv.Atoi(args[2])
	Aval = Aval - X
	Bval = Bval + X
	fmt.Printf("Aval = %d, Bval = %d\n", Aval, Bval)

	// Write the state back to the ledger
	err = stub.PutState(A, []byte(strconv.Itoa(Aval)))
	if err != nil {
		return nil, err
	}

	// Write the state back to the ledger
	// err = stub.PutState("Test", []byte("this is a test"))
	// if err != nil {
	// 	return nil, err
	// }


	err = stub.PutState(B, []byte(strconv.Itoa(Bval)))
	if err != nil {
		return nil, err
	}
	//Event based
	b, err := stub.GetState(EVENT_COUNTER)
	if err != nil {
		return nil, errors.New("Failed to get state")
	}
	noevts, _ := strconv.Atoi(string(b))

	tosend := "Event Counter is " + string(b)

	err = stub.PutState(EVENT_COUNTER, []byte(strconv.Itoa(noevts+1)))
	if err != nil {
		return nil, err
	}

	err = stub.SetEvent("evtsender", []byte(tosend))
	if err != nil {
		return nil, err
	}
	return nil, nil
}
//
// // Deletes an entity from state
// func (t *SimpleChaincode) delete(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
// 	if len(args) != 1 {
// 		return nil, errors.New("Incorrect number of arguments. Expecting 1")
// 	}
//
// 	A := args[0]
//
// 	// Delete the key from the state in ledger
// 	err := stub.DelState(A)
// 	if err != nil {
// 		return nil, errors.New("Failed to delete state")
// 	}
//
// 	return nil, nil
// }

// Query callback representing the query of a chaincode
func (t *SimpleChaincode) Query(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	// if function != "query" {
	// 	return nil, errors.New("Invalid query function name. Expecting \"query\"")
	// }

	if function == "getSupplements" {
		return t.getSupplements(stub, args)
	}

	if function == "getEmployers"{
		return t.getEmployers(stub,args)
	}

	if function == "getSupplementById"{
		return t.getSupplementById(stub,args)
	}

	// var A string // Entities
	// var err error

	if len(args) != 1 {
		return nil, errors.New("Incorrect number of arguments. Expecting name of the person to query")
	}

	// A = args[0]

	// Get the state from the ledger
	// Avalbytes, err := stub.GetState(A)
	// if err != nil {
	// 	jsonResp := "{\"Error\":\"Failed to get state for " + A + "\"}"
	// 	return nil, errors.New(jsonResp)
	// }
	//
	// if Avalbytes == nil {
	// 	jsonResp := "{\"Error\":\"Nil amount for " + A + "\"}"
	// 	return nil, errors.New(jsonResp)
	// }
	//
	// jsonResp := "{\"Name\":\"" + A + "\",\"Amount\":\"" + string(Avalbytes) + "\"}"
	// fmt.Printf("Query Response:%s\n", jsonResp)

	attr, _ := stub.ReadCertAttribute("typeOfUser") //callerRole, err := stub.ReadCertAttribute("role")
	attrString := string(attr)
	if attrString == "University"{
		Avalbytes, err := stub.GetState("Test")
		if err != nil {
			jsonResp := "{\"Error\":\"Failed to get state for TEST\"}"
			return nil, errors.New(jsonResp)
		}
		return Avalbytes, nil
		}else{
			return nil, errors.New("Only University typeOfUsers may perform this action not " + attrString)
		}
	}


	/**
	Get all supplements that belong to a user, if its type is Student
	Or all supplements issued by that user, if its type is University
	**/
	func (t *SimpleChaincode) getSupplements(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {

		if len(args) != 1 {
			return nil, errors.New("Incorrect number of arguments. Expecting name of the person to query")
		}
		eID := args[0]

		//get all supplements from the state
		assetBytes, err := stub.GetState("assets")
		if err != nil {
			jsonResp := "{\"Error\":\"Failed to get state for key \"assets\"}"
			return nil, errors.New(jsonResp)
		}
		res := Assets{}
		json.Unmarshal([]byte(assetBytes), &res)

		supps:= SupplementsAsset{Supplements:res.Supplements}
		matchingSupplements := make([]DiplomaSupplement,0)

		// Here the ABAC API is called to verify the attributes, only then will the new
		// supplement be added
		isUniversity, _ := stub.VerifyAttribute("typeOfUser", []byte("University"))
		isStudent, _ := stub.VerifyAttribute("typeOfUser", []byte("Student"))

		if isUniversity {
			for _,element := range supps.Supplements {
				// element is the element from someSlice for where we are
				if element.University == eID {
					matchingSupplements = append(matchingSupplements,element)
				}
			}
			encodedSupps,_ := json.Marshal(matchingSupplements)
			return []byte(encodedSupps), nil
		}


		if isStudent{
			for _,element := range supps.Supplements {
				// element is the element from someSlice for where we are
				if element.Owner == eID {
					matchingSupplements = append(matchingSupplements,element)
				}
			}
			encodedSupps,_ := json.Marshal(matchingSupplements)
			return []byte(encodedSupps), nil
		}

		return nil, errors.New("Only University or Students may perform this query")

	}

	/**
	Get all the employers Ids of the blockchain
	**/
	func (t *SimpleChaincode) getEmployers(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
		assetBytes, err := stub.GetState("assets")
		if err != nil {
			jsonResp := "{\"Error\":\"Failed to get state for key \"assets\"}"
			return nil, errors.New(jsonResp)
		}
		res := Assets{}
		json.Unmarshal([]byte(assetBytes), &res)

		emps:= EmployersAsset{Employers:res.Employers}
		encodedEmpl,_ := json.Marshal(emps)

		return []byte(encodedEmpl), nil
	}


	/**
	Get the supplement by the given id, if the user
	belongs to the Authorized Users for the supplemnt, or the user
	is the owner of the supplement
	**/
	func (t *SimpleChaincode) getSupplementById(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {

		if len(args) != 1 {
			return nil, errors.New("Incorrect number of arguments. Expecting name of the person to query")
		}
		suplementId := args[0]

		assetBytes, err := stub.GetState("assets")
		if err != nil {
			jsonResp := "{\"Error\":\"Failed to get state for key \"assets\"}"
			return nil, errors.New(jsonResp)
		}
		assets := Assets{}
		json.Unmarshal([]byte(assetBytes), &assets)

		supplement, position := findSupplementInSlice(assets.Supplements, suplementId)
		if position == -1{
			return nil, errors.New("No Supplement Found with the given ID")
		}

		authorizedUsers   := supplement.Authorized
		isAllowed := false
		eid, err := stub.ReadCertAttribute("eID")
		eidString := string(eid)

		if eidString == supplement.Owner{
			isAllowed = true
			}	else{
				for _,element := range authorizedUsers {
					// element is the element from someSlice for where we are
					if eidString == element {
						isAllowed = true
					}
				}
			}

			if isAllowed{
				encodedResult,err  := json.Marshal(supplement)
				if err != nil {
					return nil, err
				}
				return []byte(encodedResult), nil
			}else{
				return nil, errors.New("User not Authorized to see this supplement")
			}

	}






			// Puts a new DiplomaSupplement to the state
			// args[0] the DiplomaSupplement JSON string
			func (t *SimpleChaincode) publish(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
				if len(args) != 1 {
					return nil, errors.New("Incorrect number of arguments. Expecting 1")
				}


				//encode into a DiplomaSupplement strct the argument
				suplementString := args[0]
				suplement := DiplomaSupplement{}
				json.Unmarshal([]byte(suplementString), &suplement)

				// Here the ABAC API is called to verify the attributes, only then will the new
				// supplement be added
				isUniversity, _ := stub.VerifyAttribute("typeOfUser", []byte("University"))
				isIssuedBySender, _ := stub.VerifyAttribute("eID", []byte(suplement.University))

				if isUniversity && isIssuedBySender{
					//get the assets from the state
					assetBytes, err := stub.GetState("assets")
					if err != nil {
						jsonResp := "{\"Error\":\"Failed to get state for key \"assets\"}"
						return nil, errors.New(jsonResp)
					}
					assets := Assets{}
					json.Unmarshal([]byte(assetBytes), &assets)
					//apend the received supplement to the assets
					supplementSlice := assets.Supplements
					supplementSlice = append(supplementSlice,suplement)
					assets.Supplements = supplementSlice

					//update the state with the new assets
					encodedAssets,err  := json.Marshal(assets)
					if err != nil {
						return nil, err
					}
					err = stub.PutState("assets", []byte(encodedAssets))
					if err != nil {
						return nil, err
					}
				}
				return nil, nil
				// }

				// return nil, errors.New("Only University users  may perform this query not " + attrString)

			}




			// Updates a DiplomaSupplement, passed by its id, (args[0]) such that
			// it can be viewed by the user args[1]
			func (t *SimpleChaincode) addAuthorizedUser(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
				if len(args) != 2 {
					return nil, errors.New("Incorrect number of arguments. Expecting 2")
				}
				//the DiplomaSupplement id
				suplementId := args[0]
				//the user that should be allowed to view the supplement
				newUser := args[1]


				//get the assets from the state
				assetBytes, err := stub.GetState("assets")
				if err != nil {
					jsonResp := "{\"Error\":\"Failed to get state for key \"assets\"}"
					return nil, errors.New(jsonResp)
				}
				//get the supplements from the assets
				assets := Assets{}
				json.Unmarshal([]byte(assetBytes), &assets)
				supplementSlice := assets.Supplements

				supToUpdate , position := findSupplementInSlice(supplementSlice, suplementId)
				if position == -1 {
					return nil, errors.New("No supplement found with the given ID " + suplementId)
				}


				// Here the ABAC API is called to verify the attributes, only then will the
				// supplement be updated
				isStudent, _ := stub.VerifyAttribute("typeOfUser", []byte("Student"))
				isOwner, _ := stub.VerifyAttribute("eID", []byte(supToUpdate.Owner))

				if isStudent && isOwner{

					supToUpdate.Authorized = append(supToUpdate.Authorized,newUser)

					//delete the old version of the supplement
					supplementSlice = removeFromSlice(supplementSlice,position)
					//add the new supplement
					supplementSlice = append(supplementSlice,supToUpdate)

					assets.Supplements = supplementSlice

					//update the state with the new assets
					encodedAssets,err  := json.Marshal(assets)
					if err != nil {
						return nil, err
					}
					err = stub.PutState("assets", []byte(encodedAssets))
					if err != nil {
						return nil, err
					}
				}
				return nil, nil
			}


			func findSupplementInSlice(s []DiplomaSupplement, supplementId string) (res DiplomaSupplement, pos int){
				pos = -1
				for index,element := range s {
					// element is the element from someSlice for where we are
					if element.Id == supplementId {
						res = element
						pos = index
					}
				}
				return res, pos
			}


			func removeFromSlice(s []DiplomaSupplement, i int) []DiplomaSupplement {
				s[len(s)-1], s[i] = s[i], s[len(s)-1]
				return s[:len(s)-1]
			}



			func main() {
				err := shim.Start(new(SimpleChaincode))
				if err != nil {
					fmt.Printf("Error starting Simple chaincode: %s", err)
				}
			}
