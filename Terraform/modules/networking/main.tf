resource "aws_vpc" "medimate_vpc" {
  cidr_block =  var.vpc_cidr
  enable_dns_hostnames = var.enable_dns_hostnames
  tags={
    Name="medimate_vpc"
  }
}

resource "aws_subnet" "medimate_public_subnet" {
  vpc_id                  = aws_vpc.medimate_vpc.id
  cidr_block              = var.subnet_cidr
  map_public_ip_on_launch = var.map_public_ip_on_launch
  availability_zone       = var.subnet_availability_zone

  tags = {
    Name = "medimate_public_subnet"
  }

}

resource "aws_internet_gateway" "medimate_internet_gateway" {
  vpc_id = aws_vpc.medimate_vpc.id
  tags = {
    Name = "dev-igw"
  }
}

resource "aws_route_table" "medimate_public_rt" {
  vpc_id = aws_vpc.medimate_vpc.id
  tags = {
    Name = "dev_public_rt"
  }
}

resource "aws_route" "default_route" {
  route_table_id         = aws_route_table.medimate_public_rt.id
  destination_cidr_block = var.destination_cidr_block
  gateway_id             = aws_internet_gateway.medimate_internet_gateway.id
}

resource "aws_route_table_association" "medimate_public_assoc" {
  subnet_id      = aws_subnet.medimate_public_subnet.id
  route_table_id = aws_route_table.medimate_public_rt.id
}

resource "aws_security_group" "medimate_sg" {
  name        = "dev_sg"
  description = "dev_security_group"
  vpc_id      = aws_vpc.medimate_vpc.id

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"] # can put ur ip address
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
