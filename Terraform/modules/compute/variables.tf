variable "instance_type" {
  type = string
  description = "insatnce type"
  default = "t3.micro"
}

variable "volume_size" {
    type = number
  default = 8
}

variable "ami_id" {
  type = string
  description = "ami id"
}


variable "user_data_path" {
  type = string
  description = "userdata path"
}

variable "private_key_path" {
    type = string
  description = "private key path"
  default = "~/.ssh/medimate_keypair"
}

variable "public_key_path" {
  type = string
  description = "public key path"
  default = "~/.ssh/medimate_keypair.pub"
}

variable "host_os" {
  type = string
  description = "host os"
}

variable "security_group_id" {
  type = string
  description = "security group id"

}

variable "subnet_id" {
  type = string
  description = "subnet id"
}