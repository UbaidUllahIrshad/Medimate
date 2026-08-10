output "medimate_server_ip" {
  description = "Public IP address of the deployed Medimate instance"
  value       = module.compute.public_ip
}

output "vpc_id" {
  description = "ID of the created Medimate VPC"
  value       = module.networking.vpc_id
}

output "public_subnet_id" {
  description = "ID of the created public subnet"
  value       = module.networking.subnet_id
}

output "security_group_id" {
  description = "ID of the created security group"
  value       = module.networking.security_group_id
}