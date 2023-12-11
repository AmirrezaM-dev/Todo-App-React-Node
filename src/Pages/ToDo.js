import { Route, Routes } from "react-router-dom"
import { useEffect, useState } from "react"
import { useAuth } from "../Components/useAuth"
import { useMain } from "../Components/useMain"
import Loading from "./Loading"

import { Button, Col, Collapse, Container, Form, ListGroup, Nav, Navbar, Row } from "react-bootstrap"
import { Link } from "react-router-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEye, faEyeSlash, faPencil, faPlus, faSpinner, faSquareCheck, faStar, faX } from "@fortawesome/free-solid-svg-icons"
import { faSquare, faStar as farStar } from "@fortawesome/free-regular-svg-icons"
import Swal from "sweetalert2"

const ToDo = () => {
	const getDate = (date) => {
		return new Date(date).toISOString().substr(0, 10)
	}
	const [date, setDate] = useState(getDate(new Date()))
	const [showLoading, setShowLoading] = useState(false)
	const [todos, setTodos] = useState({})
	const { appLoaded } = useMain()
	const { loggedIn } = useAuth()

	const { authApi, logout } = useAuth()
	const { setDisplayLocation, transitionStages, setTransitionStages, location } = useMain()
	const addItem = (parent_id) => {
		Swal.fire({
			html: `
				<input id="swal-title" placeholder="Title *" class="swal2-input" type="text" />
				<textarea id="swal-details" class="swal2-textarea" placeholder="Details"></textarea>
				<br/>
				${typeof parent_id !== "string" ? `<label>Is important?</label><input id="swal-isImportant" class="swal2-checkbox mx-2" type="checkbox" />` : ""}
			`,
			inputAttributes: {
				autocapitalize: "off",
			},
			showCancelButton: true,
			confirmButtonText: "Save",
			showLoaderOnConfirm: true,
			preConfirm: () => {
				let title = document.getElementById("swal-title").value,
					details = document.getElementById("swal-details").value,
					isImportant = typeof parent_id !== "string" ? document.getElementById("swal-isImportant").checked : false
				if (!title.length) {
					document.getElementById("swal-title").focus()
					return false
				}
				return {
					title,
					details,
					isImportant,
				}
			},
			allowOutsideClick: () => !Swal.isLoading(),
		}).then((result) => {
			if (result.isConfirmed) {
				Swal.fire({
					allowOutsideClick: () => !Swal.isLoading(),
					didOpen: () => {
						Swal.showLoading()
					},
				})
				const { title, details, isImportant } = result.value
				let sendData = {
					title,
					details,
					isImportant,
					date,
				}
				sendData = typeof parent_id === "string" ? { ...sendData, parent_id } : sendData
				authApi.post("/api/todo/create", sendData).then((response) => {
					if (typeof parent_id === "string")
						setTodos({
							...todos,
							[date + "_children"]: {
								...todos[date + "_children"],
								[parent_id]: {
									...todos[date + "_children"][parent_id],
									[response.data.newTodo._id]: response.data.newTodo,
								},
							},
						})
					else {
						if (isImportant)
							setTodos({
								...todos,
								important: {
									...todos.important,
									[response.data.newTodo._id]: response.data.newTodo,
								},
							})
						else
							setTodos({
								...todos,
								[date]: {
									...todos[date],
									[response.data.newTodo._id]: response.data.newTodo,
								},
							})
					}
					Swal.fire({
						title: "Successfully created!",
						icon: "success",
					})
				})
			}
		})
	}
	const editItem = (todo, wasImportant) => {
		Swal.fire({
			html: `
				<input id="swal-title" placeholder="Title *" class="swal2-input" value="${todo.title}" type="text" />
				<textarea id="swal-details" class="swal2-textarea" placeholder="Details">${todo.details}</textarea>
				<br/>
				${typeof todo.parent !== "string" ? `<label>Is important?</label><input id="swal-isImportant" class="swal2-checkbox mx-2" type="checkbox" ${wasImportant ? "checked" : ""} />` : ""}
			`,
			inputAttributes: {
				autocapitalize: "off",
			},
			showCancelButton: true,
			confirmButtonText: "Save",
			showLoaderOnConfirm: true,
			preConfirm: () => {
				let title = document.getElementById("swal-title").value,
					details = document.getElementById("swal-details").value,
					isImportant = typeof todo.parent !== "string" ? document.getElementById("swal-isImportant").checked : false
				if (!title.length) {
					document.getElementById("swal-title").focus()
					return false
				}
				return {
					title,
					details,
					isImportant,
				}
			},
			allowOutsideClick: () => !Swal.isLoading(),
		}).then((result) => {
			if (result.isConfirmed) {
				Swal.fire({
					allowOutsideClick: () => !Swal.isLoading(),
					didOpen: () => {
						Swal.showLoading()
					},
				})
				const { title, details, isImportant } = result.value
				let sendData = {
					id: todo._id,
					title,
					details,
					isImportant,
				}
				sendData = typeof todo.parent === "string" ? { ...sendData, parent_id: todo.parent } : sendData
				authApi.post("/api/todo/edit", sendData).then(() => {
					if (todo.parent)
						setTodos({
							...todos,
							[getDate(todo.date) + "_children"]: {
								...todos[getDate(todo.date) + "_children"],
								[todo.parent]: {
									...todos[getDate(todo.date) + "_children"][todo.parent],
									[todo._id]: { ...todo, ...sendData },
								},
							},
						})
					else {
						if (wasImportant && isImportant)
							setTodos({
								...todos,
								important: {
									...todos.important,
									[todo._id]: { ...todo, ...sendData },
								},
							})
						else if (wasImportant && !isImportant) {
							const { [todo._id]: currentImportant, ...important } = todos.important
							setTodos({
								...todos,
								important,
								[getDate(currentImportant.date)]: {
									...todos[getDate(currentImportant.date)],
									[currentImportant._id]: { ...currentImportant, ...sendData },
								},
							})
						} else if (!wasImportant && isImportant) {
							const { [todo._id]: currentTodo, ...restTodos } = todos[getDate(todo.date)]
							setTodos({
								...todos,
								important: {
									...todos.important,
									[currentTodo._id]: { ...currentTodo, ...sendData },
								},
								[getDate(todo.date)]: restTodos,
							})
						}
					}
					Swal.fire({
						title: "Successfully updated!",
						icon: "success",
					})
				})
			}
		})
	}
	useEffect(() => {
		if (!todos[date]) {
			setShowLoading(true)
			authApi.post("api/todo/get", { date }).then((response) => {
				let newTodos = {},
					childrenTodos = {}
				response.data.ToDos.map((newTodo) => (newTodos = { ...newTodos, [newTodo._id]: newTodo }))
				response.data.ToDosChildren.map(
					(childrenTodo) =>
						(childrenTodos = {
							...childrenTodos,
							[childrenTodo.parent]: {
								...childrenTodos[childrenTodo.parent],
								[childrenTodo._id]: childrenTodo,
							},
						})
				)
				if (!todos.important) {
					authApi
						.post("api/todo/getImportant", { date })
						.then((response) => {
							let importantTodos = {}
							response.data.ToDos.map(
								(importantTodo) =>
									(importantTodos = {
										...importantTodos,
										[importantTodo._id]: importantTodo,
									})
							)
							setTodos({
								...todos,
								important: importantTodos,
								[date]: newTodos,
								[date + "_children"]: childrenTodos,
							})
						})
						.finally(() => setShowLoading(false))
				} else {
					setShowLoading(false)
					setTodos({
						...todos,
						[date]: newTodos,
						[date + "_children"]: childrenTodos,
					})
				}
			})
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [date])

	return (
		<Routes>
			<Route
				path="/"
				element={
					appLoaded && loggedIn && !showLoading ? (
						<div className={`bg-dark bg-gradient text-white min-vh-100 d-flex align-items-center px-5`}>
							<Container fluid>
								<Row className="mx-auto">
									<Col sm={8} className="border rounded rounded-5 overflow-hidden shadow shadow-lg mx-auto">
										<Row className="fadeOut">
											<Col
												sm={12}
												className={`px-0 px-xl-5 ${transitionStages.formAnimation}`}
												onAnimationEnd={() => {
													setTransitionStages({
														...transitionStages,
														sideAnimation: "fadeOut",
														formAnimation: "fadeOut",
														textFade: "fadeOut",
													})
													setDisplayLocation(location)
												}}
											>
												<Navbar data-bs-theme="dark" className="border-bottom mb-3">
													<Container>
														<Navbar.Brand href="#home">To Do App</Navbar.Brand>
														<Navbar.Collapse className="justify-content-center">
															<Nav className="mx-auto">
																<Form.Control type="date" onChange={(e) => setDate(e.target.value)} value={date} placeholder="name@example.com" />
															</Nav>
														</Navbar.Collapse>
														<Navbar.Toggle />
														<Navbar className="justify-content-end">
															<Navbar.Text>
																<Link onClick={logout}>Sign Out</Link>
															</Navbar.Text>
														</Navbar>
													</Container>
												</Navbar>

												{todos.important && Object.keys(todos.important).length ? (
													<ListGroup className="shadow">
														{Object.keys(todos.important).map((key) => {
															const { [key]: currentImportant, ...restImportant } = todos.important
															return (
																<ListGroup.Item className="bg-transparent text-white" key={key}>
																	<Row>
																		<Col sm={8}>{currentImportant.title}</Col>
																		<Col sm={4} className="text-end">
																			<FontAwesomeIcon
																				onClick={() => {
																					addItem(currentImportant._id)
																				}}
																				icon={faPlus}
																				className="cursor-pointer mx-1 text-success"
																			/>
																			<FontAwesomeIcon
																				onClick={
																					!currentImportant.importantLoading
																						? () => {
																								setTodos({
																									...todos,
																									important: { ...todos.important, [currentImportant._id]: { ...currentImportant, importantLoading: true } },
																								})
																								authApi
																									.post("/api/todo/important", {
																										_id: key,
																										to: false,
																									})
																									.then(() => {
																										todos[getDate(currentImportant.date)]
																											? setTodos({
																													...todos,
																													important: restImportant,
																													[getDate(currentImportant.date)]: {
																														...todos[getDate(currentImportant.date)],
																														[currentImportant._id]: currentImportant,
																													},
																											  })
																											: setTodos({
																													...todos,
																													important: restImportant,
																											  })
																									})
																						  }
																						: () => {}
																				}
																				icon={currentImportant.importantLoading ? faSpinner : faStar}
																				spin={currentImportant.importantLoading}
																				className="cursor-pointer mx-1 text-warning"
																			/>
																			<FontAwesomeIcon
																				onClick={
																					!currentImportant.statusLoading
																						? () => {
																								setTodos({
																									...todos,
																									important: { ...todos.important, [currentImportant._id]: { ...currentImportant, statusLoading: true } },
																								})
																								authApi
																									.post("/api/todo/status", {
																										_id: key,
																										to: currentImportant.status === "true" ? false : true,
																									})
																									.then(() => {
																										setTodos({
																											...todos,
																											important: {
																												...todos.important,
																												[key]: {
																													...currentImportant,
																													status: currentImportant.status === "true" ? "false" : "true",
																												},
																											},
																										})
																									})
																						  }
																						: () => {}
																				}
																				icon={currentImportant.statusLoading ? faSpinner : currentImportant.status === "true" ? faSquareCheck : faSquare}
																				spin={currentImportant.statusLoading}
																				className="cursor-pointer mx-1 text-secondary"
																			/>
																			{todos[getDate(currentImportant.date) + "_children"] && todos[getDate(currentImportant.date) + "_children"][key] && Object.keys(todos[getDate(currentImportant.date) + "_children"][key]).length ? (
																				<FontAwesomeIcon
																					onClick={() => {
																						setTodos({
																							...todos,
																							important: {
																								...todos.important,
																								[key]: {
																									...currentImportant,
																									isCollapsed: !currentImportant.isCollapsed,
																								},
																							},
																						})
																					}}
																					icon={currentImportant.isCollapsed ? faEyeSlash : faEye}
																					className="cursor-pointer mx-1 text-primary"
																				/>
																			) : (
																				<></>
																			)}
																			<FontAwesomeIcon onClick={() => editItem(currentImportant, true)} icon={faPencil} className="cursor-pointer mx-1 text-info" />
																			<FontAwesomeIcon
																				onClick={
																					!currentImportant.removeLoading
																						? () => {
																								setTodos({
																									...todos,
																									important: { ...todos.important, [currentImportant._id]: { ...currentImportant, removeLoading: true } },
																								})
																								authApi
																									.post("/api/todo/remove", {
																										_id: key,
																									})
																									.then(() => {
																										setTodos({
																											...todos,
																											important: restImportant,
																										})
																									})
																						  }
																						: () => {}
																				}
																				icon={currentImportant.removeLoading ? faSpinner : faX}
																				spin={currentImportant.removeLoading}
																				className="cursor-pointer mx-1 text-danger"
																			/>
																		</Col>
																		<Collapse in={currentImportant.isCollapsed && todos[getDate(currentImportant.date) + "_children"][key] && Object.keys(todos[getDate(currentImportant.date) + "_children"][key]).length ? true : false} className="mt-3">
																			<Col sm={12}>
																				<div className="text-center mb-2">{currentImportant.details}</div>
																				{todos[getDate(currentImportant.date) + "_children"] && todos[getDate(currentImportant.date) + "_children"][key] ? (
																					<ListGroup>
																						{Object.keys(todos[getDate(currentImportant.date) + "_children"][key]).map((childKey) => {
																							const { [childKey]: currentImportantChild, ...restChildren } = todos[getDate(currentImportant.date) + "_children"][key]
																							return (
																								<ListGroup.Item key={childKey} className="bg-transparent text-white border-success">
																									<Row>
																										<Col sm={9}>{currentImportantChild.title}</Col>
																										<Col sm={3} className="text-end">
																											<FontAwesomeIcon
																												onClick={
																													!currentImportantChild.statusLoading
																														? () => {
																																setTodos({
																																	...todos,
																																	[getDate(currentImportant.date) + "_children"]: {
																																		...todos[getDate(currentImportant.date) + "_children"],
																																		[key]: {
																																			...todos[getDate(currentImportant.date) + "_children"][key],
																																			[childKey]: {
																																				...todos[getDate(currentImportant.date) + "_children"][key][childKey],
																																				statusLoading: true,
																																			},
																																		},
																																	},
																																})
																																authApi
																																	.post("/api/todo/status", {
																																		_id: childKey,
																																		to: todos[getDate(currentImportant.date) + "_children"][key][childKey].status === "true" ? false : true,
																																	})
																																	.then(() => {
																																		setTodos({
																																			...todos,
																																			[getDate(currentImportant.date) + "_children"]: {
																																				...todos[getDate(currentImportant.date) + "_children"],
																																				[key]: {
																																					...todos[getDate(currentImportant.date) + "_children"][key],
																																					[childKey]: {
																																						...todos[getDate(currentImportant.date) + "_children"][key][childKey],
																																						status: todos[getDate(currentImportant.date) + "_children"][key][childKey].status === "true" ? "false" : "true",
																																					},
																																				},
																																			},
																																		})
																																	})
																														  }
																														: () => {}
																												}
																												icon={currentImportantChild.statusLoading ? faSpinner : todos[getDate(currentImportant.date) + "_children"][key][childKey].status === "true" ? faSquareCheck : faSquare}
																												spin={currentImportantChild.statusLoading}
																												className="cursor-pointer mx-1 text-secondary"
																											/>
																											<FontAwesomeIcon onClick={() => editItem(todos[getDate(currentImportant.date) + "_children"][key][childKey], false)} icon={faPencil} className="cursor-pointer mx-1 text-info" />
																											<FontAwesomeIcon
																												onClick={
																													!currentImportantChild.removeLoading
																														? () => {
																																setTodos({
																																	...todos,
																																	[getDate(currentImportant.date) + "_children"]: {
																																		...todos[getDate(currentImportant.date) + "_children"],
																																		[key]: {
																																			...todos[getDate(currentImportant.date) + "_children"][key],
																																			[childKey]: {
																																				...todos[getDate(currentImportant.date) + "_children"][key][childKey],
																																				removeLoading: true,
																																			},
																																		},
																																	},
																																})
																																authApi
																																	.post("/api/todo/remove", {
																																		_id: childKey,
																																	})
																																	.then(() => {
																																		setTodos({
																																			...todos,
																																			[getDate(currentImportant.date) + "_children"]: {
																																				...todos[getDate(currentImportant.date) + "_children"],
																																				[key]: restChildren,
																																			},
																																		})
																																	})
																														  }
																														: () => {}
																												}
																												icon={currentImportantChild.removeLoading ? faSpinner : faX}
																												spin={currentImportantChild.removeLoading}
																												className="cursor-pointer mx-1 text-danger"
																											/>
																										</Col>
																									</Row>
																								</ListGroup.Item>
																							)
																						})}
																					</ListGroup>
																				) : (
																					<></>
																				)}
																			</Col>
																		</Collapse>
																	</Row>
																</ListGroup.Item>
															)
														})}
													</ListGroup>
												) : (
													<></>
												)}
												{todos.important && Object.keys(todos.important).length && todos[date] && Object.keys(todos[date]).length ? <hr /> : <></>}
												{todos[date] && Object.keys(todos[date]).length ? (
													<ListGroup>
														{Object.keys(todos[date]).map((key) => {
															const { [key]: currentTodo, ...restTodos } = todos[date]
															return (
																<ListGroup.Item className="bg-transparent text-white" key={key}>
																	<Row>
																		<Col sm={8}>{currentTodo.title}</Col>
																		<Col sm={4} className="text-end">
																			<FontAwesomeIcon
																				onClick={() => {
																					addItem(currentTodo._id)
																				}}
																				icon={faPlus}
																				className="cursor-pointer mx-1 text-success"
																			/>
																			<FontAwesomeIcon
																				onClick={
																					!currentTodo.importantLoading
																						? () => {
																								setTodos({
																									...todos,
																									[date]: {
																										...todos[date],
																										[currentTodo._id]: { ...currentTodo, importantLoading: true },
																									},
																								})
																								authApi
																									.post("/api/todo/important", {
																										_id: key,
																										to: true,
																									})
																									.then(() => {
																										setTodos({
																											...todos,
																											[date]: restTodos,
																											important: {
																												...todos.important,
																												[key]: currentTodo,
																											},
																										})
																									})
																						  }
																						: () => {}
																				}
																				icon={currentTodo.importantLoading ? faSpinner : farStar}
																				spin={currentTodo.importantLoading}
																				className="cursor-pointer mx-1 text-warning"
																			/>
																			<FontAwesomeIcon
																				onClick={
																					!currentTodo.statusLoading
																						? () => {
																								setTodos({
																									...todos,
																									[date]: {
																										...todos[date],
																										[key]: {
																											...currentTodo,
																											statusLoading: true,
																										},
																									},
																								})
																								authApi
																									.post("/api/todo/status", {
																										_id: key,
																										to: currentTodo.status === "true" ? false : true,
																									})
																									.then(() => {
																										setTodos({
																											...todos,
																											[date]: {
																												...todos[date],
																												[key]: {
																													...currentTodo,
																													status: currentTodo.status === "true" ? "false" : "true",
																												},
																											},
																										})
																									})
																						  }
																						: () => {}
																				}
																				icon={currentTodo.statusLoading ? faSpinner : currentTodo.status === "true" ? faSquareCheck : faSquare}
																				spin={currentTodo.statusLoading}
																				className="cursor-pointer mx-1 text-secondary"
																			/>
																			{todos[getDate(currentTodo.date) + "_children"] && todos[getDate(currentTodo.date) + "_children"][key] && Object.keys(todos[getDate(currentTodo.date) + "_children"][key]).length ? (
																				<FontAwesomeIcon
																					onClick={() => {
																						setTodos({
																							...todos,
																							[date]: {
																								...todos[date],
																								[key]: {
																									...currentTodo,
																									isCollapsed: !currentTodo.isCollapsed,
																								},
																							},
																						})
																					}}
																					icon={currentTodo.isCollapsed ? faEyeSlash : faEye}
																					className="cursor-pointer mx-1 text-primary"
																				/>
																			) : (
																				<></>
																			)}
																			<FontAwesomeIcon onClick={() => editItem(currentTodo, false)} icon={faPencil} className="cursor-pointer mx-1 text-info" />
																			<FontAwesomeIcon
																				onClick={
																					!currentTodo.removeLoading
																						? () => {
																								setTodos({
																									...todos,
																									[date]: {
																										...todos[date],
																										[key]: {
																											...currentTodo,
																											removeLoading: true,
																										},
																									},
																								})
																								authApi
																									.post("/api/todo/remove", {
																										_id: key,
																									})
																									.then(() => {
																										setTodos({
																											...todos,
																											[date]: {
																												...restTodos,
																											},
																										})
																									})
																						  }
																						: () => {}
																				}
																				icon={currentTodo.removeLoading ? faSpinner : faX}
																				spin={currentTodo.removeLoading}
																				className="cursor-pointer mx-1 text-danger"
																			/>
																		</Col>
																		<Collapse in={currentTodo.isCollapsed && todos[getDate(currentTodo.date) + "_children"][key] && Object.keys(todos[getDate(currentTodo.date) + "_children"][key]).length ? true : false} className="mt-3">
																			<Col sm={12}>
																				<div className="text-center mb-2">{currentTodo.details}</div>
																				{todos[getDate(currentTodo.date) + "_children"] && todos[getDate(currentTodo.date) + "_children"][key] ? (
																					<ListGroup>
																						{Object.keys(todos[getDate(currentTodo.date) + "_children"][key]).map((childKey) => {
																							const { [childKey]: currentChild, ...restChildren } = todos[getDate(currentTodo.date) + "_children"][key]
																							return (
																								<ListGroup.Item key={childKey} className="bg-transparent text-white border-success">
																									<Row>
																										<Col sm={9}>{currentChild.title}</Col>
																										<Col sm={3} className="text-end">
																											<FontAwesomeIcon
																												onClick={
																													!currentChild.statusLoading
																														? () => {
																																setTodos({
																																	...todos,
																																	[getDate(currentTodo.date) + "_children"]: {
																																		...todos[getDate(currentTodo.date) + "_children"],
																																		[key]: {
																																			...todos[getDate(currentTodo.date) + "_children"][key],
																																			[childKey]: {
																																				...currentChild,
																																				statusLoading: true,
																																			},
																																		},
																																	},
																																})
																																authApi
																																	.post("/api/todo/status", {
																																		_id: childKey,
																																		to: currentChild.status === "true" ? false : true,
																																	})
																																	.then(() => {
																																		setTodos({
																																			...todos,
																																			[getDate(currentTodo.date) + "_children"]: {
																																				...todos[getDate(currentTodo.date) + "_children"],
																																				[key]: {
																																					...todos[getDate(currentTodo.date) + "_children"][key],
																																					[childKey]: {
																																						...currentChild,
																																						status: currentChild.status === "true" ? "false" : "true",
																																					},
																																				},
																																			},
																																		})
																																	})
																														  }
																														: () => {}
																												}
																												icon={currentChild.statusLoading ? faSpinner : currentChild.status === "true" ? faSquareCheck : faSquare}
																												spin={currentChild.statusLoading}
																												className="cursor-pointer mx-1 text-secondary"
																											/>
																											<FontAwesomeIcon onClick={() => editItem(currentChild, false)} icon={faPencil} className="cursor-pointer mx-1 text-info" />
																											<FontAwesomeIcon
																												onClick={
																													!currentChild.removeLoading
																														? () => {
																																setTodos({
																																	...todos,
																																	[getDate(currentTodo.date) + "_children"]: {
																																		...todos[getDate(currentTodo.date) + "_children"],
																																		[key]: {
																																			...todos[getDate(currentTodo.date) + "_children"][key],
																																			[childKey]: {
																																				...currentChild,
																																				removeLoading: true,
																																			},
																																		},
																																	},
																																})
																																authApi
																																	.post("/api/todo/remove", {
																																		_id: childKey,
																																	})
																																	.then(() => {
																																		setTodos({
																																			...todos,
																																			[getDate(currentTodo.date) + "_children"]: {
																																				...todos[getDate(currentTodo.date) + "_children"],
																																				[key]: restChildren,
																																			},
																																		})
																																	})
																														  }
																														: () => {}
																												}
																												icon={currentChild.removeLoading ? faSpinner : faX}
																												spin={currentChild.removeLoading}
																												className="cursor-pointer mx-1 text-danger"
																											/>
																										</Col>
																									</Row>
																								</ListGroup.Item>
																							)
																						})}
																					</ListGroup>
																				) : (
																					<></>
																				)}
																			</Col>
																		</Collapse>
																	</Row>
																</ListGroup.Item>
															)
														})}
													</ListGroup>
												) : (
													<></>
												)}
												<Row className="my-3">
													<Col className="text-center">
														<Button variant="success" onClick={addItem}>
															Add Task
														</Button>
													</Col>
												</Row>
											</Col>
										</Row>
									</Col>
								</Row>
							</Container>
						</div>
					) : (
						<Loading />
					)
				}
			/>
		</Routes>
	)
}
export default ToDo
