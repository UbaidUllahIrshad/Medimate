variable "vpc_cidr" {
    type = string
    description = "VPC cidr block"
  
}

variable "enable_dns_hostnames" {
  type = bool
  default = true
}

variable "subnet_availability_zone" {
  type = string
  description = "availability zone"
  default = "us-east-1a"
}

variable "subnet_cidr" {
  type = string
  description = "subnet cidr"

}

variable "destination_cidr_block" {
    type = string
    description = "destination cidr block"
    default = "0.0.0.0/0"
  
}

variable "map_public_ip_on_launch" {
    type = bool
    default = true
  
}


