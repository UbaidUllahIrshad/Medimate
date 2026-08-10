variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "AWS region for deployment"
}

variable "vpc_cidr" {
  type        = string
  default     = "10.123.0.0/16"
  description = "VPC CIDR block"
}

variable "subnet_cidr" {
  type        = string
  default     = "10.123.0.0/24"
  description = "Subnet CIDR block"
}


variable "host_os" {
  type        = string
  default     = "linux"
  description = "Host OS for local-exec SSH config template (linux or windows)"
}

variable "user_data_path" {
  type        = string
  default     = "userdata.tpl"
  description = "File name or relative path of the userdata file in the root folder"
}

variable "public_key_path" {
  type        = string
  default     = "~/.ssh/medimate_keypair.pub"
  description = "Path to local public key file"
}

variable "private_key_path" {
  type        = string
  default     = "~/.ssh/medimate_keypair"
  description = "Path to local private key file"
}