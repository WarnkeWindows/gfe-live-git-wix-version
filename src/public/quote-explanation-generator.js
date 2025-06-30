import anthropic

client = anthropic.Anthropic(
    # defaults to os.environ.get("ANTHROPIC_API_KEY")
    api_key="my_api_key",
)

message = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=20000,
    temperature=1,
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Use the quote_explanation_generator tool to test this configuration:\n\n{\n  \"window_specifications\": [\n    {\n      \"window_id\": \"W001\",\n      \"type\": \"double_hung\",\n      \"dimensions\": {\"width\": 36, \"height\": 48},\n      \"material\": \"vinyl\",\n      \"features\": [\"low_e_glass\", \"argon_fill\"]\n    }\n  ],\n  \"pricing_breakdown\": {\n    \"subtotal\": 2500,\n    \"tax\": 200,\n    \"total\": 2700\n  },\n  \"customer_info\": {\n    \"name\": \"Test Customer\"\n  },\n  \"explanation_style\": \"detailed\"\n}\n\nGenerate a professional quote explanation for Good Faith Exteriors."
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "tool_use",
                    "name": "quote_explanation_generator",
                    "id": "toolu_01SQ1Cjif8A2QUyHNAvKYjNL",
                    "input": {
                        "window_specifications": [
                            {
                                "window_id": "W001",
                                "type": "double_hung",
                                "dimensions": {
                                    "width": 36,
                                    "height": 48
                                },
                                "material": "vinyl",
                                "features": [
                                    "low_e_glass",
                                    "argon_fill"
                                ]
                            }
                        ],
                        "pricing_breakdown": {
                            "subtotal": 2500,
                            "tax": 200,
                            "total": 2700
                        },
                        "customer_info": {
                            "name": "Test Customer"
                        },
                        "explanation_style": "detailed"
                    }
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "tool_result",
                    "tool_use_id": "toolu_01SQ1Cjif8A2QUyHNAvKYjNL",
                    "content": ""
                }
            ]
        }
    ],
    tools=[
        {
            "type": "custom",
            "name": "quote_explanation_generator",
            "description": "Generates detailed, customer-friendly explanations of window replacement quotes for Good Faith Exteriors. Creates professional explanations that address customer concerns, highlight benefits, and provide clear cost breakdowns with timeline expectations.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "window_specifications": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "window_id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string",
                                    "enum": [
                                        "casement",
                                        "double_hung",
                                        "sliding",
                                        "awning",
                                        "fixed",
                                        "bay",
                                        "bow"
                                    ]
                                },
                                "dimensions": {
                                    "type": "object",
                                    "properties": {
                                        "width": {
                                            "type": "number"
                                        },
                                        "height": {
                                            "type": "number"
                                        },
                                        "depth": {
                                            "type": "number"
                                        }
                                    }
                                },
                                "material": {
                                    "type": "string",
                                    "enum": [
                                        "vinyl",
                                        "wood",
                                        "aluminum",
                                        "fiberglass",
                                        "composite"
                                    ]
                                },
                                "features": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    },
                    "pricing_breakdown": {
                        "type": "object",
                        "properties": {
                            "window_costs": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "window_id": {
                                            "type": "string"
                                        },
                                        "unit_cost": {
                                            "type": "number"
                                        },
                                        "labor_cost": {
                                            "type": "number"
                                        }
                                    }
                                }
                            },
                            "subtotal": {
                                "type": "number"
                            },
                            "tax": {
                                "type": "number"
                            },
                            "total": {
                                "type": "number"
                            },
                            "financing_options": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "term_months": {
                                            "type": "number"
                                        },
                                        "monthly_payment": {
                                            "type": "number"
                                        },
                                        "interest_rate": {
                                            "type": "number"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "customer_info": {
                        "type": "object",
                        "properties": {
                            "name": {
                                "type": "string"
                            },
                            "address": {
                                "type": "string"
                            },
                            "timeline_preference": {
                                "type": "string",
                                "enum": [
                                    "asap",
                                    "within_month",
                                    "within_quarter",
                                    "flexible"
                                ]
                            },
                            "primary_concerns": {
                                "type": "array",
                                "items": {
                                    "type": "string"
                                }
                            }
                        }
                    },
                    "explanation_style": {
                        "type": "string",
                        "enum": [
                            "detailed",
                            "concise",
                            "technical",
                            "conversational"
                        ],
                        "description": "Style of explanation based on customer preference"
                    }
                },
                "required": [
                    "window_specifications",
                    "pricing_breakdown"
                ]
            }
        }
    ]
)
print(message.content)