import anthropic

client = anthropic.Anthropic(
    # defaults to os.environ.get("ANTHROPIC_API_KEY")
    api_key="my_api_key",
)

message = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=20000,
    temperature=1,
    system="You are a quality assurance specialist for Good Faith Exteriors window installations. You have access to the measurement_validator tool for ensuring measurement accuracy and industry compliance.",
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Use the measurement_validator tool to validate these sample measurements:\n\n{\n  \"measurement_data\": {\n    \"windows\": [\n      {\n        \"id\": \"window_1\",\n        \"dimensions\": {\n          \"width\": 36.25,\n          \"height\": 48.0,\n          \"depth\": 6.5\n        },\n        \"measurement_method\": \"ai_analysis\",\n        \"confidence_score\": 92\n      }\n    ],\n    \"reference_objects\": [\n      {\n        \"type\": \"credit_card\",\n        \"detected_size\": 3.375,\n        \"expected_size\": 3.375,\n        \"scale_accuracy\": 100\n      }\n    ]\n  },\n  \"validation_criteria\": {\n    \"minimum_confidence\": 85,\n    \"standard_sizes_check\": true,\n    \"architectural_feasibility\": true\n  }\n}\n\nProvide comprehensive validation results for Good Faith Exteriors quality standards."
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "I'll validate these window measurements using our quality assurance protocols for Good Faith Exteriors. Let me run the validation with your provided data."
                },
                {
                    "type": "tool_use",
                    "name": "measurement_validator",
                    "id": "toolu_01MqxCMB4GYtjRTzs7TAHHrA",
                    "input": {
                        "measurement_data": {
                            "windows": [
                                {
                                    "id": "window_1",
                                    "dimensions": {
                                        "width": 36.25,
                                        "height": 48,
                                        "depth": 6.5
                                    },
                                    "measurement_method": "ai_analysis",
                                    "confidence_score": 92
                                }
                            ],
                            "reference_objects": [
                                {
                                    "type": "credit_card",
                                    "detected_size": 3.375,
                                    "expected_size": 3.375,
                                    "scale_accuracy": 100
                                }
                            ]
                        },
                        "validation_criteria": {
                            "minimum_confidence": 85,
                            "standard_sizes_check": true,
                            "architectural_feasibility": true,
                            "measurement_consistency": true
                        },
                        "quality_standards": {
                            "industry_standard_compliance": true,
                            "tolerance_inches": 0.25,
                            "require_multiple_references": false
                        }
                    }
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "tool_result",
                    "tool_use_id": "toolu_01MqxCMB4GYtjRTzs7TAHHrA",
                    "content": ""
                }
            ]
        }
    ],
    tools=[
        {
            "type": "custom",
            "name": "measurement_validator",
            "description": "Validates window measurements for accuracy and feasibility using industry standards and quality assurance protocols. Provides confidence scores and recommendations for measurement improvement for Good Faith Exteriors quality control. Ensures measurements meet AAMA and NFRC compliance standards with ±1/4 inch tolerance requirements.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "measurement_data": {
                        "type": "object",
                        "properties": {
                            "windows": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "id": {
                                            "type": "string"
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
                                        "measurement_method": {
                                            "type": "string",
                                            "enum": [
                                                "ai_analysis",
                                                "manual_measurement",
                                                "reference_scaling",
                                                "hybrid"
                                            ]
                                        },
                                        "confidence_score": {
                                            "type": "number",
                                            "minimum": 0,
                                            "maximum": 100
                                        }
                                    }
                                }
                            },
                            "reference_objects": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "type": {
                                            "type": "string"
                                        },
                                        "detected_size": {
                                            "type": "number"
                                        },
                                        "expected_size": {
                                            "type": "number"
                                        },
                                        "scale_accuracy": {
                                            "type": "number"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "validation_criteria": {
                        "type": "object",
                        "properties": {
                            "minimum_confidence": {
                                "type": "number",
                                "default": 80
                            },
                            "standard_sizes_check": {
                                "type": "boolean",
                                "default": true
                            },
                            "architectural_feasibility": {
                                "type": "boolean",
                                "default": true
                            },
                            "measurement_consistency": {
                                "type": "boolean",
                                "default": true
                            }
                        }
                    },
                    "quality_standards": {
                        "type": "object",
                        "properties": {
                            "tolerance_inches": {
                                "type": "number",
                                "default": 0.25
                            },
                            "require_multiple_references": {
                                "type": "boolean",
                                "default": false
                            },
                            "industry_standard_compliance": {
                                "type": "boolean",
                                "default": true
                            }
                        }
                    }
                },
                "required": [
                    "measurement_data"
                ]
            }
        }
    ]
)
print(message.content)