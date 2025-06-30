import anthropic

client = anthropic.Anthropic(
    # defaults to os.environ.get("ANTHROPIC_API_KEY")
    api_key="my_api_key",
)

message = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=20000,
    temperature=1,
    system="You are a customer service specialist for Good Faith Exteriors. You have access to the customer_communication_generator tool for creating personalized, professional communications that strengthen customer relationships.",
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Use the customer_communication_generator tool to create a welcome message:\n\n{\n  \"communication_type\": \"welcome_new_customer\",\n  \"customer_data\": {\n    \"first_name\": \"Sarah\",\n    \"last_name\": \"Johnson\",\n    \"email\": \"sarah.johnson@email.com\",\n    \"preferred_contact_method\": \"email\",\n    \"communication_style\": \"friendly\"\n  },\n  \"project_data\": {\n    \"window_count\": 8,\n    \"total_cost\": 15500,\n    \"window_types\": [\"double_hung\", \"casement\"]\n  },\n  \"business_context\": {\n    \"season\": \"spring\",\n    \"urgency_level\": \"medium\"\n  },\n  \"personalization_options\": {\n    \"mention_energy_savings\": true,\n    \"add_referral_incentive\": true\n  }\n}\n\nCreate a warm, professional welcome message for this new Good Faith Exteriors customer."
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "I'll create a warm, professional welcome message for Sarah Johnson using the customer communication generator. I notice that \"friendly\" isn't one of the available communication style options, so I'll use \"casual\" as the closest match to achieve the friendly tone you're looking for."
                },
                {
                    "type": "tool_use",
                    "name": "customer_communication_generator",
                    "id": "toolu_01EiEMby1X45Ga74znnUQfn7",
                    "input": {
                        "communication_type": "welcome_new_customer",
                        "customer_data": {
                            "first_name": "Sarah",
                            "last_name": "Johnson",
                            "email": "sarah.johnson@email.com",
                            "preferred_contact_method": "email",
                            "communication_style": "casual"
                        },
                        "project_data": {
                            "window_count": 8,
                            "total_cost": 15500,
                            "window_types": [
                                "double_hung",
                                "casement"
                            ]
                        },
                        "business_context": {
                            "season": "spring",
                            "urgency_level": "medium"
                        },
                        "personalization_options": {
                            "mention_energy_savings": true,
                            "add_referral_incentive": true
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
                    "tool_use_id": "toolu_01EiEMby1X45Ga74znnUQfn7",
                    "content": ""
                }
            ]
        }
    ],
    tools=[
        {
            "type": "custom",
            "name": "customer_communication_generator",
            "description": "Generates personalized customer communications for Good Faith Exteriors throughout the window replacement process. Creates professional, warm, and informative messages for various touchpoints including estimates, appointments, installations, and follow-ups. Maintains Good Faith Exteriors' professional brand voice while addressing customer concerns proactively.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "communication_type": {
                        "type": "string",
                        "enum": [
                            "welcome_new_customer",
                            "estimate_ready_notification",
                            "appointment_confirmation",
                            "pre_installation_reminder",
                            "installation_day_instructions",
                            "post_installation_followup",
                            "warranty_information",
                            "maintenance_reminder",
                            "referral_request",
                            "seasonal_promotion"
                        ],
                        "description": "Type of customer communication to generate"
                    },
                    "customer_data": {
                        "type": "object",
                        "properties": {
                            "first_name": {
                                "type": "string"
                            },
                            "last_name": {
                                "type": "string"
                            },
                            "email": {
                                "type": "string"
                            },
                            "phone": {
                                "type": "string"
                            },
                            "address": {
                                "type": "string"
                            },
                            "preferred_contact_method": {
                                "type": "string",
                                "enum": [
                                    "email",
                                    "phone",
                                    "text",
                                    "mail"
                                ]
                            },
                            "communication_style": {
                                "type": "string",
                                "enum": [
                                    "formal",
                                    "casual",
                                    "technical",
                                    "simple"
                                ]
                            }
                        },
                        "required": [
                            "first_name"
                        ]
                    },
                    "project_data": {
                        "type": "object",
                        "properties": {
                            "project_id": {
                                "type": "string"
                            },
                            "window_count": {
                                "type": "number"
                            },
                            "total_cost": {
                                "type": "number"
                            },
                            "installation_date": {
                                "type": "string",
                                "format": "date"
                            },
                            "estimated_duration": {
                                "type": "string"
                            },
                            "window_types": {
                                "type": "array",
                                "items": {
                                    "type": "string"
                                }
                            },
                            "special_features": {
                                "type": "array",
                                "items": {
                                    "type": "string"
                                }
                            },
                            "warranty_period": {
                                "type": "string"
                            }
                        }
                    },
                    "business_context": {
                        "type": "object",
                        "properties": {
                            "season": {
                                "type": "string",
                                "enum": [
                                    "spring",
                                    "summer",
                                    "fall",
                                    "winter"
                                ]
                            },
                            "current_promotions": {
                                "type": "array",
                                "items": {
                                    "type": "string"
                                }
                            },
                            "urgency_level": {
                                "type": "string",
                                "enum": [
                                    "low",
                                    "medium",
                                    "high",
                                    "urgent"
                                ]
                            },
                            "follow_up_reason": {
                                "type": "string"
                            }
                        }
                    },
                    "personalization_options": {
                        "type": "object",
                        "properties": {
                            "include_weather_reference": {
                                "type": "boolean",
                                "default": false
                            },
                            "mention_energy_savings": {
                                "type": "boolean",
                                "default": true
                            },
                            "include_maintenance_tips": {
                                "type": "boolean",
                                "default": false
                            },
                            "add_referral_incentive": {
                                "type": "boolean",
                                "default": false
                            }
                        }
                    }
                },
                "required": [
                    "communication_type",
                    "customer_data"
                ]
            }
        }
    ]
)
print(message.content)