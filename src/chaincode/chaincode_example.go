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
	"encoding/json"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"crypto/rand"

)

// SimpleChaincode example simple Chaincode implementation
type SimpleChaincode struct {
}
//Diploma Suplement Structure
type DiplomaSupplement struct {
	Owner string
	Name string
	Surname string
	University string
	Authorized []string
	Id string
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

type DiplomaSupplementMapsAsset struct{
	DiplomaSupplementMaps map[string]DiplomaSupplementMap
}

type DiplomaSupplementMap struct {
	DSHash string
	DSId string
	Email string
	Code string
	Recipient string
}

// Structure that holds all the assets of the app
type Assets struct{
	Supplements []DiplomaSupplement
	Employers []string
	Universities []string
	DiplomaSupplementMap map[string]DiplomaSupplementMap
}

type AuthorizedUser struct{
	Email string
	Eid   string
}


var EVENT_COUNTER = "event_counter"


func (t *SimpleChaincode) Init(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {

	// "list", slice in golang, that will hold the DiplomaSupplements as strings
	var supplements = make([]DiplomaSupplement,0)
	// slice, that will hold the eIDs of the employers as strings
	var employers = make([]string,0)
	// slice, that will hold the eIDs of the universities as strings
	var universities = make([]string,0)
	//map that will hold the diplomasupplmet-hash-recipient map
	var diplomaSupplementMaps = make(map[string]DiplomaSupplementMap)


	assets := Assets{Universities: universities, Employers:employers, Supplements:supplements, DiplomaSupplementMap:diplomaSupplementMaps}
	encodedAssets,err  := json.Marshal(assets)
	err = stub.PutState("assets", []byte(encodedAssets))
	if err != nil {
		return nil, err
	}

	return nil, nil
}


func (t *SimpleChaincode) Invoke(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {

	if function == "publish"{
		return t.publish(stub, args)
	}

	if function == "addAuthorizedUser"{
		return t.addAuthorizedUser(stub, args)
	}

	if function == "addDiplomaSupplementMap"{
		return t.addDiplomaSupplementMap(stub,args)
	}

	if function == "addRecepientToDSMap"{
		return t.addRecepientToDSMap(stub,args)
	}

	if function == "genCodeForDSMap"{
		return t.genCodeForDSMap(stub,args)
	}

	return nil, nil
}


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

	if function == "getDiplomaSupplementMapsByHash" {
		return t.getDiplomaSupplementMapsByHash(stub,args)
	}


	// var A string // Entities
	// var err error

	if len(args) != 1 {
		return nil, errors.New("Incorrect number of arguments. Expecting name of the person to query")
	}

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
	Get all the DiplomaSupplementMaps using its key (i.e. DS hash)
	**/
	func (t *SimpleChaincode) getDiplomaSupplementMapsByHash(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {

		if len(args) != 1 {
			return nil, errors.New("Incorrect number of arguments. Expecting the hash of the diplomaSupplement")
		}
		dsHash := args[0]
		assetBytes, err := stub.GetState("assets")
		if err != nil {
			jsonResp := "{\"Error\":\"Failed to get state for key \"assets\"}"
			return nil, errors.New(jsonResp)
		}
		res := Assets{}
		json.Unmarshal([]byte(assetBytes), &res)

		diplomaSupplementMaps:=res.DiplomaSupplementMap
		result,ok := diplomaSupplementMaps[dsHash]
		if ok {
			encodedRes,_ := json.Marshal(result)
			return []byte(encodedRes), nil
			}else{
				return nil, errors.New("Could not find the requested ds has")
			}

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
						tosend := "Incorrect number of arguments. Expecting 1" + "." + stub.GetTxID()
						err := stub.SetEvent("evtsender", []byte(tosend))
						if err != nil {
							return nil, err
						}
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
							tosend := "{\"Error\":\"Failed to get state for key \"assets\"}" + "." + stub.GetTxID()
							err = stub.SetEvent("evtsender", []byte(tosend))
							if err != nil {
								return nil, err
							}
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
							tosend := "Could not  marshal assets" + "." + stub.GetTxID()
							err = stub.SetEvent("evtsender", []byte(tosend))
							if err != nil {
								return nil, err
							}
						}
						err = stub.PutState("assets", []byte(encodedAssets))
						if err != nil {
							tosend := "Could not place assets back in the state" + "." + stub.GetTxID()
							err = stub.SetEvent("evtsender", []byte(tosend))
							if err != nil {
								return nil, err
							}
						}
						//Execution of chaincode finished successfully
						tosend := "Tx chaincode finished OK." + stub.GetTxID()
						err = stub.SetEvent("evtsender", []byte(tosend))
						if err != nil {
							return nil, err
						}

					}
					return nil, nil
					// }

					// return nil, errors.New("Only University users  may perform this query not " + attrString)

				}



				// Puts a new DSMAp to the state
				// args[0] the DSMAP  JSON string
				// Only a user that has the attribute typeOfUser = Student can invoke this transaction with success
				// and he has to be the owner of the supplment as that is identified by the DSId filed of the DSMAP struct
				func (t *SimpleChaincode) addDiplomaSupplementMap(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
					if len(args) != 1 {
						return nil, errors.New("Incorrect number of arguments. Expecting 1")
					}

					//encode into a DiplomaSupplementMap from strct the argument
					dsmapString := args[0]
					dsmap := DiplomaSupplementMap{}
					json.Unmarshal([]byte(dsmapString), &dsmap)

					// Here the ABAC API is called to verify the attributes, only then will the new
					// supplement be added
					isUniversity, _ := stub.VerifyAttribute("typeOfUser", []byte("Student"))
					suplementId := dsmap.DSId


					assetBytes, err := stub.GetState("assets")
					if err != nil {
						//transactions cannot return errors this way we have to use an event
						// return nil, errors.New("No Supplement Found with the given ID")
						tosend := "Error, Failed to get state for key \"assets\"" + suplementId + "." + stub.GetTxID()
						err = stub.SetEvent("evtsender", []byte(tosend))
						if err != nil {
							return nil, err
						}
					}
					assets := Assets{}
					json.Unmarshal([]byte(assetBytes), &assets)

					supplement, position := findSupplementInSlice(assets.Supplements, suplementId)
					if position == -1{
						//transactions cannot return errors this way we have to use an event
						// return nil, errors.New("No Supplement Found with the given ID")
						tosend := "Error, No Supplement Found with the given ID" + suplementId + "." + stub.GetTxID()
						err = stub.SetEvent("evtsender", []byte(tosend))
						if err != nil {
							return nil, err
						}
					}

					//check if the supplement is issued by the user sending the transaction
					isIssuedBySender, _ := stub.VerifyAttribute("eID", []byte(supplement.Owner))

					if isUniversity && isIssuedBySender{
						//apend the received DiplomaSupplementMap to the assets
						assets.DiplomaSupplementMap[dsmap.DSHash] = dsmap

						//update the state with the new assets
						encodedAssets,err  := json.Marshal(assets)
						if err != nil {
							tosend := "Error, Marshaling Assets" + suplementId + "." + stub.GetTxID()
							err = stub.SetEvent("evtsender", []byte(tosend))
							if err != nil {
								return nil, err
							}
						}
						err = stub.PutState("assets", []byte(encodedAssets))
						if err != nil {
							tosend := "Error,putting assets back in state" + suplementId + "." + stub.GetTxID()
							err = stub.SetEvent("evtsender", []byte(tosend))
							if err != nil {
								return nil, err
							}
						}
						//Execution of chaincode finishe successfully
						tosend := "Tx chaincode finished OK." + stub.GetTxID()
						err = stub.SetEvent("evtsender", []byte(tosend))
						if err != nil {
							return nil, err
						}
					}
					return nil, nil
				}



				/*
				Adds the given recepientEid (args[1]) as the the Recepient of the DiplomaSupplementMap
				which is identified by the give DSHash (args[0])
				*/
				func (t *SimpleChaincode) addRecepientToDSMap(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
					if len(args) != 3 {
						return nil, errors.New("Incorrect number of arguments. Expecting 3")
					}

					//encode into a DiplomaSupplementMap from strct the argument
					dsHash := args[0]
					recepientEid := args[1]
					emailedCode := args[2]

					//get the assets from the state
					assetBytes, err := stub.GetState("assets")
					if err != nil {
						jsonResp := "{\"Error\":\"Failed to get state for key \"assets\"}"
						return nil, errors.New(jsonResp)
					}
					assets := Assets{}
					json.Unmarshal([]byte(assetBytes), &assets)


					//find the DSMap in the state
					dsMap,ok:= assets.DiplomaSupplementMap[dsHash]
					if ok {
						if dsMap.Recipient != "" {
							// return nil, errors.New("No DiplomaSupplementMap is already finalized! Cannot add new Recipient!")
							//transactions cannot return errors this way we have to use an event
							// return nil, errors.New("No Supplement Found with the given ID")
							tosend := "Error, DiplomaSupplementMap is already finalized! Cannot add new Recipient!" +"." + stub.GetTxID()
							err = stub.SetEvent("evtsender", []byte(tosend))
							if err != nil {
								return nil, err
							}
							}else{
								if dsMap.Code != emailedCode {
										tosend := "Error, Wrong Authorization code!" +"." + stub.GetTxID()
										err = stub.SetEvent("evtsender", []byte(tosend))
										if err != nil {
											return nil, err
										}
									}else{
										dsMap.Recipient = recepientEid
										//update the assets and put them in the state
										//update the DSMap
										assets.DiplomaSupplementMap[dsHash] = dsMap

										//update the actual supplement
										supplementSlice := assets.Supplements
										suplementId := dsMap.DSId
										supToUpdate , position := findSupplementInSlice(supplementSlice, suplementId)
										if position == -1 {
											tosend := "Error, No supplement found for the given ID" +suplementId+ "."+ stub.GetTxID()
											err = stub.SetEvent("evtsender", []byte(tosend))
											if err != nil {
												return nil, err
											}
										}
										supToUpdate.Authorized = append(supToUpdate.Authorized,recepientEid)
										//delete the old version of the supplement
										supplementSlice = removeFromSlice(supplementSlice,position)
										//add the new supplement
										supplementSlice = append(supplementSlice,supToUpdate)
										assets.Supplements = supplementSlice


										encodedAssets,err  := json.Marshal(assets)
										if err != nil {
											return nil, err
										}
										err = stub.PutState("assets", []byte(encodedAssets))
										if err != nil {
											return nil, err
										}
										//Execution of chaincode finishe successfully
										tosend := "Tx chaincode finished OK." + stub.GetTxID()
										err = stub.SetEvent("evtsender", []byte(tosend))
										if err != nil {
											return nil, err
										}
									}

								}
								}else{
									// return nil, errors.New("No DiplomaSupplementMap Found with the given hash")
									tosend := "Error, No DiplomaSupplementMap Found with the given hash " + dsHash + "."+ stub.GetTxID()
									err = stub.SetEvent("evtsender", []byte(tosend))
									if err != nil {
										return nil, err
									}

								}

								return nil, nil
							}


							/*
							generates a random string and adds it at the field of the DSMap
							*/
							func (t *SimpleChaincode) genCodeForDSMap(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
								if len(args) != 1 {
									return nil, errors.New("Incorrect number of arguments. Expecting 1")
								}
								dsHash := args[0]
								emailCode := getRandString(5)

								//get the assets from the state
								assetBytes, err := stub.GetState("assets")
								if err != nil {
									jsonResp := "{\"Error\":\"Failed to get state for key \"assets\"}"
									return nil, errors.New(jsonResp)
								}
								assets := Assets{}
								json.Unmarshal([]byte(assetBytes), &assets)

								//find the DSMap in the state
								dsMap,ok:= assets.DiplomaSupplementMap[dsHash]
								if ok {
									if dsMap.Recipient != "" {
										// return nil, errors.New("No DiplomaSupplementMap is already finalized! Cannot add new Recipient!")
										//transactions cannot return errors this way we have to use an event
										// return nil, errors.New("No Supplement Found with the given ID")
										tosend := "Error, DiplomaSupplementMap is already finalized! Cannot add new Recipient!" +"." + stub.GetTxID()
										err = stub.SetEvent("evtsender", []byte(tosend))
										if err != nil {
											return nil, err
										}
										}else{
											dsMap.Code = emailCode
											//update the assets and put them in the state
											//update the DSMap
											assets.DiplomaSupplementMap[dsHash] = dsMap

											encodedAssets,err  := json.Marshal(assets)
											if err != nil {
												return nil, err
											}
											err = stub.PutState("assets", []byte(encodedAssets))
											if err != nil {
												return nil, err
											}
											//Execution of chaincode finishe successfully
											tosend := "Tx chaincode finished OK." + stub.GetTxID()
											err = stub.SetEvent("evtsender", []byte(tosend))
											if err != nil {
												return nil, err
											}
										}
										}else{
											// return nil, errors.New("No DiplomaSupplementMap Found with the given hash")
											tosend := "Error, No DiplomaSupplementMap Found with the given hash " + dsHash + "."+ stub.GetTxID()
											err = stub.SetEvent("evtsender", []byte(tosend))
											if err != nil {
												return nil, err
											}

										}

										return nil, nil
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
											//Execution of chaincode finishe successfully
											tosend := "Tx chaincode finished OK." + stub.GetTxID()
											err = stub.SetEvent("evtsender", []byte(tosend))
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


									func findDipSupMapInSlice(s []DiplomaSupplementMap, dsHash string) (res DiplomaSupplementMap, pos int){
										pos = -1
										for index,element := range s {
											// element is the element from someSlice for where we are
											if element.DSHash == dsHash {
												res = element
												pos = index
											}
										}
										return res, pos
									}


									/**
									A DiplomaSupplement slice, s
									The position of the supplement to remove, i
									**/
									func removeFromSlice(s []DiplomaSupplement, i int) []DiplomaSupplement {
										s[len(s)-1], s[i] = s[i], s[len(s)-1]
										return s[:len(s)-1]
									}

									/**
									A DiplomaSupplementMap slice, s
									The position of the dsMap to remove, i
									**/
									func removeDipSupMapFromSlice(s []DiplomaSupplementMap, i int) []DiplomaSupplementMap {
										s[len(s)-1], s[i] = s[i], s[len(s)-1]
										return s[:len(s)-1]
									}

									/*
									make and return a random string of n-length
									*/
									func getRandString(n int) string {
										b := make([]byte, n)
										if _, err := rand.Read(b); err != nil {
											fmt.Printf("Error making random string: %s", err)
										}
										return fmt.Sprintf("%X", b)
									}



									func main() {
										err := shim.Start(new(SimpleChaincode))
										if err != nil {
											fmt.Printf("Error starting Simple chaincode: %s", err)
										}
									}
