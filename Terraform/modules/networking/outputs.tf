output "vpc_id" {
  description = "ID of the created VPC"
  value       = aws_vpc.medimate_vpc.id
}

output "subnet_id" {
  description = "ID of the public subnet"
  value       = aws_subnet.medimate_public_subnet.id
}

output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.medimate_sg.id
}